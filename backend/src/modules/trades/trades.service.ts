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
      visibility: input.visibility,
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
  const { page, limit, status, type, category, search, mine, storeOf, location, minPrice, maxPrice } = query;

  const where: Prisma.TradeWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(location ? { takeOffLocation: { contains: location, mode: 'insensitive' as const } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { amount: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {})
  };

  if (mine) {
    if (!userId) {
      throw new ApiError(401, 'Not authenticated');
    }
    where.OR = [{ creatorId: userId }, { buyerId: userId }];
  } else if (storeOf) {
    const storeOwner = await prisma.user.findUnique({ where: { username: storeOf }, select: { id: true } });
    if (!storeOwner) {
      throw new ApiError(404, 'Store not found');
    }

    where.creatorId = storeOwner.id;

    if (userId === storeOwner.id) {
      // owner sees everything
    } else {
      where.visibility = { in: ['MARKET', 'STORE'] };
    }
  } else if (userId) {
    where.OR = [{ visibility: 'MARKET' }, { creatorId: userId }, { buyerId: userId }];
  } else {
    where.visibility = 'MARKET';
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

export const editTrade = async (tradeId: string, userId: string, input: Partial<CreateTradeInput>) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }
  if (trade.creatorId !== userId) {
    throw new ApiError(403, 'You can only edit your own trade listings');
  }
  if (trade.status !== 'PENDING' || trade.buyerId) {
    throw new ApiError(409, 'This trade can no longer be edited because it has already been accepted by a buyer');
  }

  return prisma.trade.update({
    where: { id: tradeId },
    data: {
      title: input.title,
      amount: input.amount,
      category: input.category,
      visibility: input.visibility,
      condition: input.condition,
      specs: input.specs as Prisma.InputJsonValue | undefined,
      deliveryFee: input.deliveryFee,
      deliveryTime: input.deliveryTime,
      takeOffLocation: input.takeOffLocation,
      deliveryLocation: input.deliveryLocation,
      image: input.image,
      description: input.description
    },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarColor: true } },
      buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
    }
  });
};

export const cancelOwnTrade = async (tradeId: string, userId: string) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }
  if (trade.creatorId !== userId) {
    throw new ApiError(403, 'You can only cancel your own trade listings');
  }
  if (trade.status !== 'PENDING' || trade.buyerId) {
    throw new ApiError(409, 'This trade can no longer be cancelled because it has already been accepted by a buyer');
  }

  return prisma.trade.update({
    where: { id: tradeId },
    data: { status: 'REFUNDED' }
  });
};

export const getTradeById = async (id: string, userId: string | null) => {
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

  if (trade.visibility === 'PRIVATE' && trade.creatorId !== userId) {
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
export const PLATFORM_FEE_RATE = 0.013;

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

    const tradeAmount = new Prisma.Decimal(trade.amount);
    const platformFee = tradeAmount.times(PLATFORM_FEE_RATE).toDecimalPlaces(2);
    const releaseAmount = tradeAmount.minus(platformFee).plus(trade.deliveryFee);

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

    await tx.walletTransaction.create({
      data: {
        userId: sellerId,
        type: 'PLATFORM_FEE',
        provider: 'MANUAL',
        amount: platformFee,
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
      message: `Pickup confirmed for "${completedTrade.title}". Funds have been added to your wallet (a 1.3% platform fee was deducted from the sale amount).`,
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

const VALID_STATUSES = new Set(Object.keys(ALLOWED_TRANSITIONS));

export const updateTradeStatus = async (
  tradeId: string,
  userId: string,
  userRole: string,
  nextStatus: string
) => {
  if (!VALID_STATUSES.has(nextStatus)) {
    throw new ApiError(400, `Invalid status: ${nextStatus}`);
  }

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
    data: { status: nextStatus as Prisma.EnumEscrowStatusFieldUpdateOperationsInput['set'] }
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

  await notify({
    userId: cancelledTrade.creatorId,
    title: 'Trade cancelled',
    message: `"${cancelledTrade.title}" was cancelled by an admin.`,
    type: 'WARNING'
  });
  await postTradeSystemMessage(
    cancelledTrade.id,
    'This trade was cancelled by an admin.'
  );

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