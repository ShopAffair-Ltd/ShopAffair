import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { prisma } from '../../config/db.js';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tempId: true,
      name: true,
      username: true,
      email: true,
      role: true,
      verificationStatus: true,
      rejectionReason: true,
      bankName: true,
      accountNumber: true,
      walletBalance: true,
      isPro: true,
      avatarColor: true,
      phoneNumber: true,
      profilePicture: true,
      totalTrades: true,
      completedTrades: true,
      completionRate: true,
      tier: true,
      deliveryAddress: true,
      storeName: true,
      bio: true,
      location: true,
      storeCategory: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
      lastSeenAt: true,
      rating: true,
      reviewsCount: true,
      totalSales: true
    }
  });
  
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  
  res.json({ user });
});

// Get all users
router.get('/', requireAuth, async (req, res) => {
  const currentUserId = req.user!.id;

  const users = await prisma.user.findMany({
    where: { id: { not: currentUserId } },
    select: {
      id: true,
      tempId: true,
      name: true,
      username: true,
      role: true,
      verificationStatus: true,
      avatarColor: true,
      profilePicture: true,
      storeName: true,
      bio: true,
      location: true,
      storeCategory: true,
      coverImage: true,
      isPro: true,
      createdAt: true,
      updatedAt: true,
      rating: true,
      reviewsCount: true,
      totalSales: true
    }
  });

  const [connectedTrades, activeListings, blocks] = await Promise.all([
    prisma.trade.findMany({
      where: { OR: [{ creatorId: currentUserId }, { buyerId: currentUserId }] },
      select: { creatorId: true, buyerId: true }
    }),
    prisma.trade.findMany({
      where: { type: 'SUPPLY', status: { in: ['PENDING', 'FUNDED'] } },
      select: { creatorId: true }
    }),
    prisma.block.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
      select: { blockerId: true, blockedId: true }
    })
  ]);

  const connectedUserIds = new Set<string>();
  connectedTrades.forEach((t) => {
    if (t.creatorId === currentUserId && t.buyerId) connectedUserIds.add(t.buyerId);
    if (t.buyerId === currentUserId) connectedUserIds.add(t.creatorId);
  });

  const activeSellerIds = new Set(activeListings.map((t) => t.creatorId));

  const blockedUserIds = new Set<string>();
  blocks.forEach((b) => {
    blockedUserIds.add(b.blockerId === currentUserId ? b.blockedId : b.blockerId);
  });

  const usersWithChatEligibility = users.map((user) => ({
    ...user,
    canChat: !blockedUserIds.has(user.id) && (connectedUserIds.has(user.id) || activeSellerIds.has(user.id))
  }));

  res.json({ users: usersWithChatEligibility });
});

// Get user by username
router.get('/username/:username', requireAuth, async (req, res) => {
  const username = req.params.username as string;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      tempId: true,
      name: true,
      username: true,
      role: true,
      verificationStatus: true,
      avatarColor: true,
      profilePicture: true,
      storeName: true,
      bio: true,
      location: true,
      storeCategory: true,
      coverImage: true,
      isPro: true,
      createdAt: true,
      updatedAt: true,
      rating: true,
      reviewsCount: true,
      totalSales: true
    }
  });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ user });
});

// Get user stats
router.get('/:username/stats', requireAuth, async (req, res) => {
  const username = req.params.username as string;
  const currentUserId = (req as any).user.id;

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
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const isFollowing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: user.id
      }
    }
  });

  res.json({
    rating: user.rating || 0,
    reviewsCount: user.reviewsCount || 0,
    totalSales: user.totalSales || 0,
    followers: user._count.followedBy || 0,
    productsCount: user._count.products || 0,
    joinedDate: user.createdAt,
    isFollowing: !!isFollowing,
    storeName: user.storeName
  });
});

// Follow a user
router.post('/:username/follow', requireAuth, async (req, res) => {
  const username = req.params.username as string;
  const currentUserId = (req as any).user.id;

  const userToFollow = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (!userToFollow) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (userToFollow.id === currentUserId) {
    res.status(400).json({ message: 'You cannot follow yourself' });
    return;
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userToFollow.id
      }
    }
  });

  if (existing) {
    res.status(400).json({ message: 'Already following this user' });
    return;
  }

  await prisma.follow.create({
    data: {
      followerId: currentUserId,
      followingId: userToFollow.id
    }
  });

  const followersCount = await prisma.follow.count({
    where: { followingId: userToFollow.id }
  });

  res.json({ success: true, following: true, followersCount });
});

// Unfollow a user
router.delete('/:username/follow', requireAuth, async (req, res) => {
  const username = req.params.username as string;
  const currentUserId = (req as any).user.id;

  const userToUnfollow = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (!userToUnfollow) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userToUnfollow.id
      }
    }
  });

  if (!existing) {
    res.status(400).json({ message: 'You are not following this user' });
    return;
  }

  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userToUnfollow.id
      }
    }
  });

  const followersCount = await prisma.follow.count({
    where: { followingId: userToUnfollow.id }
  });

  res.json({ success: true, following: false, followersCount });
});

// Search users
router.get('/search', requireAuth, async (req, res) => {
  const q = req.query.q as string;
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { storeName: { contains: q, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      tempId: true,
      name: true,
      username: true,
      role: true,
      verificationStatus: true,
      avatarColor: true,
      profilePicture: true,
      storeName: true,
      bio: true,
      location: true,
      storeCategory: true,
      coverImage: true,
      isPro: true,
      createdAt: true,
      updatedAt: true,
      rating: true,
      reviewsCount: true,
      totalSales: true
    }
  });
  res.json({ users });
});

// Update user role
router.patch('/me/role', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { role } = req.body;
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      username: true,
      role: true
    }
  });
  res.json({ user });
});

// Update store profile
router.patch('/me/store-profile', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { storeName, bio, location, storeCategory, coverImage } = req.body;
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      storeName,
      bio,
      location,
      storeCategory,
      coverImage
    },
    select: {
      id: true,
      username: true,
      name: true,
      storeName: true,
      bio: true,
      location: true,
      storeCategory: true,
      coverImage: true
    }
  });
  res.json({ user });
});

export default router;