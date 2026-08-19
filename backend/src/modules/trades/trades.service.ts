import crypto from 'crypto';
import { prisma } from '../../config/db';
import { Prisma } from '../../generated/prisma/client.js';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';
import { getOrCreateTradeChat, postTradeSystemMessage } from '../chat/chat.service';
import type { CreateTradeInput, ListTradesQuery } from './trades.validation';

const generatePickupCode = () => crypto.randomInt(100000, 999999).toString();
export const createTrade = async (creatorId: string, input: CreateTradeInput) => {
  return prisma.trade.create({
    data: {
      title: input.title,
      creatorId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      condition: input.condition,
      specs: input.specs as Prisma.InputJsonValue | undefined,
      accountNumber: input.accountNumber,
      deliveryFee: input.deliveryFee,
      deliveryTime: input.deliveryTime,
      takeOffLocation: input.takeOffLocation,
      deliveryLocation: input.deliveryLocation,
      image: input.image,
      description: input.description,
      status: 'PENDING'
    },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarColor: true } },
      buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
    }
  });
};

export const listTrades = async (userId: string | null, query: ListTradesQuery) => {
  const { page, limit, status, type, category, search, mine } = query;

  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {})
  };

  if (mine) {
    if (!userId) {
      throw new ApiError(401, 'Not authenticated');
    }
    where.OR = [{ creatorId: userId }, { buyerId: userId }];
  }

  const [items, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true } },
        buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    }),
    prisma.trade.count({ where })
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

export const getTradeById = async (id: string) => {
  const trade = await prisma.trade.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarColor: true } },
      buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
    }
  });

  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }

  return trade;
};

export const fundTrade = async (tradeId: string, buyerId: string) => {
  const updatedTrade = await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({ where: { id: tradeId } });

    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.creatorId === buyerId) {
      throw new ApiError(400, 'You cannot fund your own trade listing');
    }
    if (trade.buyerId) {
      throw new ApiError(409, 'This trade has already been funded by another buyer');
    }
    if (trade.status !== 'PENDING' && trade.status !== 'DRAFT') {
      throw new ApiError(409, `Trade cannot be funded while in status ${trade.status}`);
    }

    const totalDue = new Prisma.Decimal(trade.amount).plus(trade.deliveryFee);

    const buyer = await tx.user.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      throw new ApiError(404, 'Buyer not found');
    }
    if (new Prisma.Decimal(buyer.walletBalance).lessThan(totalDue)) {
      throw new ApiError(402, 'Insufficient wallet balance. Please fund your wallet first.');
    }

    await tx.user.update({
      where: { id: buyerId },
      data: { walletBalance: { decrement: totalDue } }
    });

    await tx.walletTransaction.create({
      data: {
        userId: buyerId,
        type: 'ESCROW_LOCK',
        provider: 'MANUAL',
        amount: totalDue,
        status: 'SUCCESS',
        tradeId
      }
    });

    const pickupCode = generatePickupCode();

    return tx.trade.update({
      where: { id: tradeId },
      data: {
        buyerId,
        status: 'FUNDED',
        pickupCode,
        pickupAttempts: 0
      }
    });
  });

  await notify({
    userId: updatedTrade.creatorId,
    title: 'Trade funded',
    message: `A buyer has funded escrow for "${updatedTrade.title}". Hand over the item and get their pickup code to release payment.`,
    type: 'SUCCESS'
  });

  if (updatedTrade.buyerId) {
    await getOrCreateTradeChat(updatedTrade.id, updatedTrade.creatorId, updatedTrade.buyerId);
    await postTradeSystemMessage(
      updatedTrade.id,
      `Escrow funded. ₦${Number(updatedTrade.amount) + Number(updatedTrade.deliveryFee)} is now locked. The seller will release it once you share your pickup code.`
    );
  }

  return updatedTrade;
};

const MAX_PICKUP_ATTEMPTS = 5;

export const verifyPickupCode = async (tradeId: string, sellerId: string, code: string) => {
  const completedTrade = await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({ where: { id: tradeId } });

    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.creatorId !== sellerId) {
      throw new ApiError(403, 'Only the trade creator can verify pickup');
    }
    if (trade.status !== 'FUNDED') {
      throw new ApiError(409, 'Trade is not awaiting pickup verification');
    }
    if (trade.pausedByFreeze) {
      throw new ApiError(423, 'This trade is paused pending admin review and cannot be completed right now');
    }
    if (trade.pickupAttempts >= MAX_PICKUP_ATTEMPTS) {
      throw new ApiError(429, 'Maximum pickup verification attempts exceeded');
    }

    if (trade.pickupCode !== code) {
      await tx.trade.update({
        where: { id: tradeId },
        data: { pickupAttempts: { increment: 1 } }
      });
      throw new ApiError(400, 'Incorrect pickup code');
    }

    if (!trade.buyerId) {
      throw new ApiError(409, 'Trade has no associated buyer');
    }

    const releaseAmount = new Prisma.Decimal(trade.amount).plus(trade.deliveryFee);

    await tx.user.update({
      where: { id: sellerId },
      data: { walletBalance: { increment: releaseAmount } }
    });

    await tx.walletTransaction.create({
      data: {
        userId: sellerId,
        type: 'ESCROW_RELEASE',
        provider: 'MANUAL',
        amount: releaseAmount,
        status: 'SUCCESS',
        tradeId
      }
    });

    return tx.trade.update({
      where: { id: tradeId },
      data: { status: 'COMPLETED' }
    });
  });

  await Promise.all([
    notify({
      userId: completedTrade.creatorId,
      title: 'Payment released',
      message: `Pickup confirmed for "${completedTrade.title}". Funds have been added to your wallet.`,
      type: 'SUCCESS'
    }),
    completedTrade.buyerId
      ? notify({
          userId: completedTrade.buyerId,
          title: 'Trade completed',
          message: `Your pickup for "${completedTrade.title}" was confirmed. This trade is now complete.`,
          type: 'SUCCESS'
        })
      : Promise.resolve(null)
  ]);

  await postTradeSystemMessage(
    completedTrade.id,
    'Pickup code verified. Escrow has been released to the seller — this trade is now complete.'
  );

  return completedTrade;
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['FUNDED', 'DISPUTED'],
  FUNDED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  DISPUTED: [],
  REFUNDED: []
};

export const updateTradeStatus = async (
  tradeId: string,
  userId: string,
  userRole: string,
  nextStatus: string
) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }

  const isParticipant = trade.creatorId === userId || trade.buyerId === userId;
  if (!isParticipant && userRole !== 'admin') {
    throw new ApiError(403, 'You are not a participant in this trade');
  }

  if (userRole !== 'admin') {
    const allowed = ALLOWED_TRANSITIONS[trade.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ApiError(400, `Cannot transition trade from ${trade.status} to ${nextStatus}`);
    }
  }

  return prisma.trade.update({
    where: { id: tradeId },
    data: { status: nextStatus as never }
  });
};

export const forceCancelTrade = async (tradeId: string) => {
  const cancelledTrade = await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({ where: { id: tradeId } });
    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.status === 'COMPLETED' || trade.status === 'REFUNDED') {
      throw new ApiError(409, `Trade cannot be cancelled while in status ${trade.status}`);
    }

    if (trade.status === 'FUNDED' && trade.buyerId) {
      const refundAmount = new Prisma.Decimal(trade.amount).plus(trade.deliveryFee);

      await tx.user.update({
        where: { id: trade.buyerId },
        data: { walletBalance: { increment: refundAmount } }
      });

      await tx.walletTransaction.create({
        data: {
          userId: trade.buyerId,
          type: 'REFUND',
          provider: 'MANUAL',
          amount: refundAmount,
          status: 'SUCCESS',
          tradeId
        }
      });
    }

    return tx.trade.update({
      where: { id: tradeId },
      data: { status: 'REFUNDED' }
    });
  });

  if (cancelledTrade.buyerId) {
    await notify({
      userId: cancelledTrade.buyerId,
      title: 'Trade cancelled',
      message: `"${cancelledTrade.title}" was cancelled by an admin. Any locked funds have been refunded to your wallet.`,
      type: 'WARNING'
    });
    await postTradeSystemMessage(
      cancelledTrade.id,
      'This trade was cancelled by an admin. Any locked escrow has been refunded to the buyer.'
    );
  }

  return cancelledTrade;
};