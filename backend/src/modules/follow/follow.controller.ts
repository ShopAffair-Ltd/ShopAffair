import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { z } from 'zod';
import { followUser, unfollowUser, isFollowing, listStoreFollowers, getFollowCounts } from './follow.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

const userIdParamSchema = z.object({ userId: z.uuid() });

export const follow = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { userId } = userIdParamSchema.parse(req.params);
  const result = await followUser(user.id, userId);
  res.status(200).json({ follow: result });
});

export const unfollow = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { userId } = userIdParamSchema.parse(req.params);
  await unfollowUser(user.id, userId);
  res.status(204).send();
});

export const checkFollowing = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { userId } = userIdParamSchema.parse(req.params);
  const following = await isFollowing(user.id, userId);
  res.status(200).json({ following });
});

export const getMyFollowers = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const followers = await listStoreFollowers(user.id);
  res.status(200).json({ followers });
});

export const getCounts = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = userIdParamSchema.parse(req.params);
  const counts = await getFollowCounts(userId);
  res.status(200).json(counts);
});
