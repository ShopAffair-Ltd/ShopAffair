import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { updateStoreProfileSchema, usernameParamSchema } from './users.validation';

export const getStoreProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = usernameParamSchema.parse(req.params);
    const profile = await usersService.getStoreProfileByUsername(username);

    let followingByMe = false;
    if (req.user?.id) {
      followingByMe = await usersService.isFollowing(req.user.id, username);
    }

    res.json({ profile: { ...profile, followingByMe } });
  } catch (err) {
    next(err);
  }
};

export const updateMyStoreProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateStoreProfileSchema.parse(req.body);
    const updated = await usersService.updateStoreProfile(req.user!.id, input);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
};

export const follow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = usernameParamSchema.parse(req.params);
    const result = await usersService.followUser(req.user!.id, username);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const unfollow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = usernameParamSchema.parse(req.params);
    const result = await usersService.unfollowUser(req.user!.id, username);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = usernameParamSchema.parse(req.params);
    const currentUserId = req.user?.id;
    
    const stats = await usersService.getUserStats(username, currentUserId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};