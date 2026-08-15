import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpdateStoreProfileInput } from './users.validation';

export const getStoreProfileByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      storeName: true,
      bio: true,
      location: true,
      storeCategory: true,
      coverImage: true,
      isPro: true,
      verificationStatus: true,
      profilePicture: true,
      rating: true,
      reviewsCount: true,
      totalSales: true,
      createdAt: true,
      _count: {
        select: { followedBy: true, products: true }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, 'Store not found');
  }

  const productAgg = await prisma.product.aggregate({
    where: { sellerId: user.id },
    _avg: { rating: true },
    _sum: { salesCount: true, reviewsCount: true }
  });

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    storeName: user.storeName ?? user.name,
    bio: user.bio ?? '',
    location: user.location ?? '',
    category: user.storeCategory ?? '',
    coverImage: user.coverImage,
    isVerified: user.verificationStatus === 'VERIFIED',
    plan: user.isPro ? 'Pro Merchant' : 'Free Plan',
    avatar: user.profilePicture,
    followers: user._count.followedBy,
    productCount: user._count.products,
    rating: productAgg._avg.rating ?? user.rating ?? 0,
    totalSales: productAgg._sum.salesCount ?? user.totalSales ?? 0,
    reviewsCount: productAgg._sum.reviewsCount ?? user.reviewsCount ?? 0,
    joinedDate: user.createdAt
  };
};

export const updateStoreProfile = async (userId: string, input: UpdateStoreProfileInput) => {
  return prisma.user.update({
    where: { id: userId },
    data: input
  });
};

export const followUser = async (followerId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({ where: { username: targetUsername } });
  if (!target) {
    throw new ApiError(404, 'User not found');
  }
  if (target.id === followerId) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId: target.id } },
    create: { followerId, followingId: target.id },
    update: {}
  });

  const followersCount = await prisma.follow.count({
    where: { followingId: target.id }
  });

  return { success: true, following: true, followersCount };
};

export const unfollowUser = async (followerId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({ where: { username: targetUsername } });
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } }
  });

  if (!existing) {
    throw new ApiError(400, 'You are not following this user');
  }

  await prisma.follow.delete({
    where: { followerId_followingId: { followerId, followingId: target.id } }
  });

  const followersCount = await prisma.follow.count({
    where: { followingId: target.id }
  });

  return { success: true, following: false, followersCount };
};

export const isFollowing = async (followerId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({ where: { username: targetUsername } });
  if (!target) return false;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } }
  });
  return !!existing;
};

export const getUserStats = async (username: string, currentUserId?: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      rating: true,
      reviewsCount: true,
      totalSales: true,
      createdAt: true,
      storeName: true,
      _count: {
        select: {
          followedBy: true,
          products: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let isFollowing = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id
        }
      }
    });
    isFollowing = !!follow;
  }

  return {
    rating: user.rating || 0,
    reviewsCount: user.reviewsCount || 0,
    totalSales: user.totalSales || 0,
    followers: user._count.followedBy || 0,
    productsCount: user._count.products || 0,
    joinedDate: user.createdAt,
    isFollowing,
    storeName: user.storeName
  };
};