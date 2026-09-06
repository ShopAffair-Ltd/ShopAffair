import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';

export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } }
  });
  if (existing) {
    return existing;
  }

  return prisma.follow.create({ data: { followerId, followingId } });
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } }
  });
  if (!existing) {
    throw new ApiError(404, 'You are not following this user');
  }

  await prisma.follow.delete({ where: { id: existing.id } });
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } }
  });
  return !!existing;
};

/**
 * Lists the followers of a store owner, including whether each follower is
 * currently blocked by the owner — used to render the block/unblock icon in
 * store settings.
 */
export const listStoreFollowers = async (storeOwnerId: string) => {
  const followers = await prisma.follow.findMany({
    where: { followingId: storeOwnerId },
    orderBy: { createdAt: 'desc' },
    include: {
      follower: {
        select: { id: true, username: true, name: true, avatarColor: true, profilePicture: true }
      }
    }
  });

  const blocks = await prisma.block.findMany({
    where: { blockerId: storeOwnerId },
    select: { blockedId: true }
  });
  const blockedIds = new Set(blocks.map((b: { blockedId: string }) => b.blockedId));

  return followers.map((f: (typeof followers)[number]) => ({
    id: f.follower.id,
    username: f.follower.username,
    name: f.follower.name,
    avatarColor: f.follower.avatarColor,
    profilePicture: f.follower.profilePicture,
    followedAt: f.createdAt,
    isBlocked: blockedIds.has(f.follower.id)
  }));
};

export const getFollowCounts = async (userId: string) => {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } })
  ]);
  return { followers, following };
};
