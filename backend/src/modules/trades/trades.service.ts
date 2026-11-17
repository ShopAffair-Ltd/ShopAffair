import crypto from 'crypto';
import { prisma } from '../../config/db';
import { Prisma } from '../../generated/prisma/client.js';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';
import { getOrCreateTradeChat, postTradeSystemMessage } from '../chat/chat.service';
import type { CreateTradeInput, ListTradesQuery } from './trades.validation';

const generatePickupCode = () => crypto.randomInt(100000, 999999).toString();

export const createTrade = async (creatorId: string, input: CreateTradeInput) => {
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, isPro: true }
  });
  if (!creator) {
    throw new ApiError(404, 'User not found');
  }

  // Trades can only be posted to the Open Market if creator has an active Store Plan (Seller Pro)
  if (input.visibility === 'MARKET' && !creator.isPro) {
    throw new ApiError(403, 'Posting trades to the Open Market requires an active Store Plan subscription.');
  }

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
      creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
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
    // Only trades whose creator has an active store plan appear on Open Market
    where.OR = [
      { visibility: 'MARKET', creator: { isPro: true } },
      { creatorId: userId },
      { buyerId: userId }
    ];
  } else {
    where.visibility = 'MARKET';
    where.creator = { isPro: true };
  }

  const [items, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
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

  if (input.visibility === 'MARKET') {
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isPro: true }
    });
    if (!creator?.isPro) {
      throw new ApiError(403, 'Posting trades to the Open Market requires an active Store Plan subscription.');
    }
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
      creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
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
    data: { status: 'REFUNDED' },
    include: {
      creator: { select: { id: true, username: true, name: true, avatarColor: true } },
      buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
    }
  });
};

export const deleteOwnTrade = async (tradeId: string, userId: string) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }
  if (trade.creatorId !== userId) {
    throw new ApiError(403, 'You can only delete your own trade listings');
  }
  if (trade.buyerId || !['DRAFT', 'PENDING', 'REFUNDED'].includes(trade.status)) {
    throw new ApiError(409, 'This trade cannot be deleted because it has already been engaged or funded');
  }

  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.updateMany({
      where: { sharedTradeId: tradeId },
      data: { sharedTradeId: null }
    });
    await tx.chatRoom.updateMany({
      where: { associatedTradeId: tradeId },
      data: { associatedTradeId: null }
    });
    await tx.trade.delete({ where: { id: tradeId } });
  });

  return { deleted: true, id: tradeId };
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
    const trade = await tx.trade.findUnique({
      where: { id: tradeId },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
        buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    });

    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.creatorId === buyerId) {
      throw new ApiError(400, 'You cannot fund your own trade listing');
    }

    // If the same buyer already funded this exact trade (e.g. retrying after a network hiccup),
    // return it idempotently instead of throwing 409.
    if (trade.buyerId === buyerId && trade.status === 'FUNDED') {
      return trade;
    }

    const specsObj =
      trade.specs && typeof trade.specs === 'object' && !Array.isArray(trade.specs)
        ? (trade.specs as Record<string, unknown>)
        : {};
    const qtyKey = Object.keys(specsObj).find((k) => ['qty', 'quantity', 'stock'].includes(k.toLowerCase()));
    const rawQty = qtyKey ? Number(specsObj[qtyKey]) : 1;
    const currentQty = Number.isFinite(rawQty) && rawQty >= 1 ? Math.floor(rawQty) : 1;

    if (trade.buyerId && currentQty <= 1) {
      throw new ApiError(409, 'This item is out of stock (already purchased by another buyer)');
    }
    if (trade.status !== 'PENDING' && trade.status !== 'DRAFT' && currentQty <= 1) {
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

    const pickupCode = generatePickupCode();

    // If stock (Qty) > 1, decrement Qty on the original listing so other buyers can still purchase,
    // and create a new FUNDED escrow trade for this buyer.
    if (currentQty > 1 && !trade.buyerId && (trade.status === 'PENDING' || trade.status === 'DRAFT')) {
      const updatedSpecs = { ...specsObj, [qtyKey || 'Qty']: String(currentQty - 1) };
      await tx.trade.update({
        where: { id: tradeId },
        data: { specs: updatedSpecs as Prisma.InputJsonValue }
      });

      const childSpecs = { ...specsObj, [qtyKey || 'Qty']: '1' };
      const childTrade = await tx.trade.create({
        data: {
          title: trade.title,
          creatorId: trade.creatorId,
          buyerId,
          amount: trade.amount,
          status: 'FUNDED',
          type: trade.type,
          category: trade.category,
          visibility: 'PRIVATE',
          condition: trade.condition,
          specs: childSpecs as Prisma.InputJsonValue,
          accountNumber: trade.accountNumber,
          deliveryFee: trade.deliveryFee,
          deliveryTime: trade.deliveryTime,
          takeOffLocation: trade.takeOffLocation,
          deliveryLocation: trade.deliveryLocation,
          image: trade.image,
          description: trade.description,
          pickupCode,
          pickupAttempts: 0
        },
        include: {
          creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
          buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
        }
      });

      await tx.walletTransaction.create({
        data: {
          userId: buyerId,
          type: 'ESCROW_LOCK',
          provider: 'MANUAL',
          amount: totalDue,
          status: 'SUCCESS',
          tradeId: childTrade.id
        }
      });

      return childTrade;
    }

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

    return tx.trade.update({
      where: { id: tradeId },
      data: {
        buyerId,
        status: 'FUNDED',
        pickupCode,
        pickupAttempts: 0
      },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
        buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    });
  });

  try {
    await notify({
      userId: updatedTrade.creatorId,
      title: 'Trade funded',
      message: `A buyer has funded escrow for "${updatedTrade.title}". Hand over the item and get their pickup code to release payment.`,
      type: 'SUCCESS'
    });

    if (updatedTrade.buyerId) {
      await notify({
        userId: updatedTrade.buyerId,
        title: 'Escrow payment locked',
        message: `₦${(Number(updatedTrade.amount) + Number(updatedTrade.deliveryFee)).toLocaleString()} is locked in escrow for "${updatedTrade.title}". Your pickup code is ${updatedTrade.pickupCode}.`,
        type: 'SUCCESS'
      });
      await getOrCreateTradeChat(updatedTrade.id, updatedTrade.creatorId, updatedTrade.buyerId);
      await postTradeSystemMessage(
        updatedTrade.id,
        `Escrow funded. ₦${Number(updatedTrade.amount) + Number(updatedTrade.deliveryFee)} is now locked. The seller will release it once you share your pickup code.`
      );
    }
  } catch (postErr) {
    console.error('Non-fatal post-fund notification/chat error:', postErr);
  }

  return updatedTrade;
};

export const buyAgainTrade = async (tradeId: string, buyerId: string, deliveryLocation?: string) => {
  const newTrade = await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({
      where: { id: tradeId },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    });

    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.creatorId === buyerId) {
      throw new ApiError(400, 'You cannot buy your own trade listing');
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

    const pickupCode = generatePickupCode();

    const createdTrade = await tx.trade.create({
      data: {
        title: trade.title,
        creatorId: trade.creatorId,
        buyerId,
        amount: trade.amount,
        status: 'FUNDED',
        type: trade.type,
        category: trade.category,
        visibility: 'PRIVATE',
        condition: trade.condition,
        specs: trade.specs as Prisma.InputJsonValue | undefined,
        accountNumber: trade.accountNumber,
        deliveryFee: trade.deliveryFee,
        deliveryTime: trade.deliveryTime,
        takeOffLocation: trade.takeOffLocation,
        deliveryLocation: deliveryLocation || trade.deliveryLocation || 'To be specified by buyer',
        image: trade.image,
        description: trade.description,
        pickupCode,
        pickupAttempts: 0
      },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
        buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    });

    await tx.walletTransaction.create({
      data: {
        userId: buyerId,
        type: 'ESCROW_LOCK',
        provider: 'MANUAL',
        amount: totalDue,
        status: 'SUCCESS',
        tradeId: createdTrade.id
      }
    });

    return createdTrade;
  });

  try {
    await Promise.all([
      notify({
        userId: newTrade.creatorId,
        title: 'New order received!',
        message: `Your item "${newTrade.title}" was re-ordered by @${newTrade.buyer?.username}. Escrow is funded.`,
        type: 'SUCCESS'
      }),
      notify({
        userId: buyerId,
        title: 'Order placed & funded',
        message: `You successfully bought "${newTrade.title}". ₦${Number(newTrade.amount).toLocaleString()} is held in escrow. Your pickup code is ${newTrade.pickupCode}.`,
        type: 'SUCCESS'
      })
    ]);
    if (newTrade.buyerId) {
      await getOrCreateTradeChat(newTrade.id, newTrade.creatorId, newTrade.buyerId);
      await postTradeSystemMessage(
        newTrade.id,
        `Escrow funded. ₦${Number(newTrade.amount) + Number(newTrade.deliveryFee)} is now locked. The seller will release it once you share your pickup code.`
      );
    }
  } catch (postErr) {
    console.error('Non-fatal post-reorder notification/chat error:', postErr);
  }

  return newTrade;
};

const MAX_PICKUP_ATTEMPTS = 5;
export const PLATFORM_FEE_RATE = 0.013;

const getEffectivePlatformFeeRate = async (tx: Prisma.TransactionClient): Promise<number> => {
  const setting = await tx.platformSetting.findUnique({ where: { key: 'escrow_fee' } });
  if (!setting) return PLATFORM_FEE_RATE;
  const parsed = Number(setting.value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 25) return PLATFORM_FEE_RATE;
  return parsed / 100;
};

export const verifyPickupCode = async (tradeId: string, sellerId: string, code: string) => {
  const { completedTrade, feeRate } = await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({ where: { id: tradeId } });

    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.creatorId !== sellerId) {
      throw new ApiError(403, 'Only the trade creator can verify pickup');
    }
    if (trade.status !== 'FUNDED' && trade.status !== 'DISPUTED') {
      if (trade.status === 'COMPLETED') {
        const fullCompletedTrade = await tx.trade.findUnique({
          where: { id: tradeId },
          include: {
            creator: { select: { id: true, username: true, name: true, avatarColor: true } },
            buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
          }
        });
        return { completedTrade: fullCompletedTrade ?? trade, feeRate: 0.013 };
      }
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

    const effectiveRate = await getEffectivePlatformFeeRate(tx);
    const tradeAmount = new Prisma.Decimal(trade.amount);
    const platformFee = tradeAmount.times(effectiveRate).toDecimalPlaces(2);
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

    const updated = await tx.trade.update({
      where: { id: tradeId },
      data: { status: 'COMPLETED' },
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true, isPro: true } },
        buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    });

    return { completedTrade: updated, feeRate: effectiveRate };
  });

  const feePercentLabel = Number((feeRate * 100).toFixed(2));

  await Promise.all([
    notify({
      userId: completedTrade.creatorId,
      title: 'Payment released',
      message: `Pickup confirmed for "${completedTrade.title}". Funds have been added to your wallet (a ${feePercentLabel}% platform fee was deducted from the sale amount).`,
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
  PENDING: ['DISPUTED'],
  FUNDED: ['DISPUTED'],
  COMPLETED: [],
  DISPUTED: [],
  REFUNDED: []
};

const MONEY_MOVING_STATUSES = new Set(['FUNDED', 'COMPLETED', 'REFUNDED']);
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

  if (MONEY_MOVING_STATUSES.has(nextStatus)) {
    throw new ApiError(
      400,
      `Cannot set trade status to ${nextStatus} directly; use the dedicated escrow flow.`
    );
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

    const escrowLock = trade.buyerId
      ? await tx.walletTransaction.findFirst({
        where: { tradeId, userId: trade.buyerId, type: 'ESCROW_LOCK', status: 'SUCCESS' }
      })
      : null;

    if ((trade.status === 'FUNDED' || trade.status === 'DISPUTED') && trade.buyerId && escrowLock) {
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

export const forceReleaseTrade = async (tradeId: string) => {
  const completedTrade = await prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({ where: { id: tradeId } });
    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.status !== 'FUNDED' && trade.status !== 'DISPUTED') {
      throw new ApiError(409, `Only funded or disputed trades can be released to the seller (current status: ${trade.status})`);
    }
    if (!trade.buyerId) {
      throw new ApiError(409, 'Trade has no associated buyer');
    }

    const escrowLock = await tx.walletTransaction.findFirst({
      where: { tradeId, userId: trade.buyerId, type: 'ESCROW_LOCK', status: 'SUCCESS' }
    });
    if (!escrowLock) {
      throw new ApiError(409, 'No locked escrow balance found for this trade');
    }

    const effectiveRate = await getEffectivePlatformFeeRate(tx);
    const tradeAmount = new Prisma.Decimal(trade.amount);
    const platformFee = tradeAmount.times(effectiveRate).toDecimalPlaces(2);
    const releaseAmount = tradeAmount.minus(platformFee).plus(trade.deliveryFee);

    await tx.user.update({
      where: { id: trade.creatorId },
      data: { walletBalance: { increment: releaseAmount } }
    });

    await tx.walletTransaction.create({
      data: {
        userId: trade.creatorId,
        type: 'ESCROW_RELEASE',
        provider: 'MANUAL',
        amount: releaseAmount,
        status: 'SUCCESS',
        tradeId
      }
    });

    await tx.walletTransaction.create({
      data: {
        userId: trade.creatorId,
        type: 'PLATFORM_FEE',
        provider: 'MANUAL',
        amount: platformFee,
        status: 'SUCCESS',
        tradeId
      }
    });

    return tx.trade.update({
      where: { id: tradeId },
      data: { status: 'COMPLETED', pausedByFreeze: false }
    });
  });

  await notify({
    userId: completedTrade.creatorId,
    title: 'Dispute resolved — payout released',
    message: `An administrator ruled in your favor for "${completedTrade.title}". Escrow funds have been released to your wallet.`,
    type: 'SUCCESS'
  });

  if (completedTrade.buyerId) {
    await notify({
      userId: completedTrade.buyerId,
      title: 'Dispute resolved',
      message: `An administrator reviewed "${completedTrade.title}" and released escrow to the seller.`,
      type: 'INFO'
    });
  }

  await postTradeSystemMessage(
    completedTrade.id,
    'Dispute resolved by admin. Escrow has been released to the seller — this trade is now complete.'
  );

  return completedTrade;
};