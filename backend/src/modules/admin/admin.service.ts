import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';
import { ChatRoomType } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Lists community groups awaiting super-admin approval. Every group a
 * seller creates starts PENDING (see chat.service.createCommunity) and
 * won't appear in discoverCommunities or be usable until approved here.
 */
export const listPendingCommunities = async () => {
  return prisma.chatRoom.findMany({
    where: { type: ChatRoomType.COMMUNITY, approvalStatus: 'PENDING' },
    include: {
      creator: { select: { id: true, username: true, name: true, isPro: true, avatarColor: true } },
      _count: { select: { participants: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
};

export const approveCommunity = async (chatRoomId: string, adminUserId: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!chatRoom || chatRoom.type !== ChatRoomType.COMMUNITY) {
    throw new ApiError(404, 'Community group not found');
  }
  if (chatRoom.approvalStatus !== 'PENDING') {
    throw new ApiError(409, `Group is already ${chatRoom.approvalStatus.toLowerCase()}`);
  }

  const updated = await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: {
      approvalStatus: 'APPROVED',
      approvedById: adminUserId,
      approvedAt: new Date(),
      rejectionReason: null
    }
  });

  await notify({
    userId: chatRoom.creatorId,
    title: 'Group approved',
    message: `Your group "${chatRoom.name}" has been approved and is now live.`,
    type: 'SUCCESS'
  });

  return updated;
};

export const rejectCommunity = async (chatRoomId: string, adminUserId: string, reason: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!chatRoom || chatRoom.type !== ChatRoomType.COMMUNITY) {
    throw new ApiError(404, 'Community group not found');
  }
  if (chatRoom.approvalStatus !== 'PENDING') {
    throw new ApiError(409, `Group is already ${chatRoom.approvalStatus.toLowerCase()}`);
  }

  const updated = await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: {
      approvalStatus: 'REJECTED',
      approvedById: adminUserId,
      approvedAt: new Date(),
      rejectionReason: reason
    }
  });

  await notify({
    userId: chatRoom.creatorId,
    title: 'Group rejected',
    message: `Your group "${chatRoom.name}" was not approved. Reason: ${reason}`,
    type: 'WARNING'
  });

  return updated;
};

// ---- Account freeze/suspend (super admin control) ----

/**
 * Freezes a user: fully locks them out (checked in login and requireAuth -
 * see auth.service.loginUser and auth.middleware.requireAuth), and
 * auto-pauses any FUNDED trade they're party to, since a frozen party
 * should not be able to have their escrow silently released or refunded
 * while frozen. Paused trades require a separate admin action to resolve.
 */
export const freezeUser = async (userId: string, adminId: string, reason: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.role === 'admin') {
    throw new ApiError(403, 'Cannot freeze an admin account');
  }
  if (user.isFrozen) {
    throw new ApiError(409, 'This account is already frozen');
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isFrozen: true, frozenReason: reason, frozenAt: new Date(), frozenById: adminId }
    }),
    prisma.trade.updateMany({
      where: {
        status: 'FUNDED',
        OR: [{ creatorId: userId }, { buyerId: userId }]
      },
      data: { pausedByFreeze: true }
    })
  ]);

  await notify({
    userId,
    title: 'Account suspended',
    message: `Your account has been suspended. Reason: ${reason}`,
    type: 'ALERT'
  });

  return updated;
};

export const unfreezeUser = async (userId: string, adminId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.isFrozen) {
    throw new ApiError(409, 'This account is not frozen');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isFrozen: false, frozenReason: null, frozenAt: null, frozenById: null }
  });

  // Deliberately does NOT auto-resume paused trades - unfreezing the
  // account and resolving an in-flight escrow dispute are separate
  // decisions. An admin explicitly unpauses via resumeTrade below once
  // they've confirmed the trade itself is fine to continue.
  await notify({
    userId,
    title: 'Account reinstated',
    message: 'Your account has been reinstated and is no longer suspended.',
    type: 'SUCCESS'
  });

  return updated;
};

export const listFrozenUsers = async () => {
  return prisma.user.findMany({
    where: { isFrozen: true },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      frozenReason: true,
      frozenAt: true,
      frozenBy: { select: { username: true } }
    },
    orderBy: { frozenAt: 'desc' }
  });
};

/**
 * Un-pauses a trade that was auto-paused by a party freeze, letting it
 * resume normal fund/verify flow. Does not touch money - the admin should
 * only call this once they're satisfied the trade is safe to continue
 * (e.g. only one party was involved in the freeze and it's since resolved).
 */
export const resumeTrade = async (tradeId: string) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }
  if (!trade.pausedByFreeze) {
    throw new ApiError(409, 'This trade is not paused');
  }

  return prisma.trade.update({
    where: { id: tradeId },
    data: { pausedByFreeze: false }
  });
};

// ---- KYC verification ----

export const listPendingKyc = async () => {
  return prisma.user.findMany({
    where: { verificationStatus: 'PENDING' },
    orderBy: { verificationSubmittedAt: 'asc' }
  });
};

export const approveKyc = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: 'VERIFIED', rejectionReason: null }
  });

  await notify({ userId, title: 'Verification approved', message: 'Your account has been verified.', type: 'SUCCESS' });
  return updated;
};

export const rejectKyc = async (userId: string, reason: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: 'REJECTED', rejectionReason: reason }
  });

  await notify({ userId, title: 'Verification rejected', message: reason, type: 'WARNING' });
  return updated;
};

// ---- Audit logs ----

export const listAuditLogs = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { select: { username: true } },
        targetUser: { select: { username: true } }
      }
    }),
    prisma.auditLog.count()
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const createAuditLog = async (actorId: string, action: string, details: string, targetUserId?: string) => {
  return prisma.auditLog.create({ data: { actorId, action, details, targetUserId } });
};

// ---- Dashboard / analytics ----

export const getDashboardOverview = async () => {
  const [userCount, tradeCount, disputedCount, totalVolumeAgg, pendingKycCount, pendingGroupsCount, frozenCount] = await Promise.all([
    prisma.user.count(),
    prisma.trade.count(),
    prisma.trade.count({ where: { status: 'DISPUTED' } }),
    prisma.trade.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.chatRoom.count({ where: { type: ChatRoomType.COMMUNITY, approvalStatus: 'PENDING' } }),
    prisma.user.count({ where: { isFrozen: true } })
  ]);

  return {
    userCount,
    tradeCount,
    disputedCount,
    totalVolume: totalVolumeAgg._sum.amount ?? 0,
    pendingKycCount,
    pendingGroupsCount,
    frozenCount
  };
};

// ---- Products / Categories / Reviews (admin listing + moderation) ----

export const listAllProducts = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { seller: { select: { username: true } } }
    }),
    prisma.product.count()
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const deleteProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');
  await prisma.product.delete({ where: { id: productId } });
};

export const listAllReviews = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reviewer: { select: { username: true } },
        seller: { select: { username: true } }
      }
    }),
    prisma.review.count()
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const deleteReview = async (reviewId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(404, 'Review not found');
  await prisma.review.delete({ where: { id: reviewId } });
};

// ---- Orders (admin visibility) ----

export const listAllOrders = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        buyer: { select: { username: true } },
        seller: { select: { username: true } },
        product: { select: { title: true } }
      }
    }),
    prisma.order.count()
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

// ---- Vendors (sellers overview) ----

export const listVendors = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'seller' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, username: true, name: true, email: true, isPro: true,
        rating: true, totalSales: true, reviewsCount: true, isFrozen: true,
        verificationStatus: true, createdAt: true
      }
    }),
    prisma.user.count({ where: { role: 'seller' } })
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const listProductCategories = async () => {
  const grouped = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true }
  });
  return grouped
    .map((g) => ({ name: g.category, productCount: g._count.category }))
    .sort((a, b) => b.productCount - a.productCount);
};

export const getSystemHealth = async () => {
  const [failedTransactions, pendingWithdrawals, totalTrades, activeTrades] = await Promise.all([
    prisma.walletTransaction.count({ where: { status: 'FAILED' } }),
    prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL', status: 'PENDING' } }),
    prisma.trade.count(),
    prisma.trade.count({ where: { status: { in: ['PENDING', 'FUNDED'] } } })
  ]);

  return { failedTransactions, pendingWithdrawals, totalTrades, activeTrades };
};