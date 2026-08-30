import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { toggleFavoriteSchema } from './favorites.validation';
import { toggleFavorite, listFavorites, getFavoriteIds } from './favorites.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = toggleFavoriteSchema.parse(req.body);
  const result = await toggleFavorite(user.id, input);
  res.status(200).json(result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const favorites = await listFavorites(user.id);
  res.status(200).json({ favorites });
});

export const ids = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const result = await getFavoriteIds(user.id);
  res.status(200).json(result);
});
