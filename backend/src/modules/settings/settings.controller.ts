import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { setSettingSchema, broadcastSchema, createPromoSchema } from './settings.validation';
import {
  getAllSettings,
  setSetting,
  broadcastAlert,
  listPromoCodes,
  createPromoCode,
  togglePromoCode,
  deletePromoCode
} from './settings.service';

const requireUser = (req: Request) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  return req.user;
};

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getAllSettings();
  res.status(200).json({ settings });
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const { key, value } = setSettingSchema.parse(req.body);
  const setting = await setSetting(key, value, admin.id);
  res.status(200).json({ setting });
});

export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const { message } = broadcastSchema.parse(req.body);
  const result = await broadcastAlert(message, admin.id);
  res.status(200).json(result);
});

export const getPromoCodes = asyncHandler(async (_req: Request, res: Response) => {
  const promos = await listPromoCodes();
  res.status(200).json({ promos });
});

export const addPromoCode = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const { code, discountPct, expiresAt } = createPromoSchema.parse(req.body);
  const promo = await createPromoCode(admin.id, code, discountPct, expiresAt ? new Date(expiresAt) : undefined);
  res.status(201).json({ promo });
});

export const flipPromoCode = asyncHandler(async (req: Request, res: Response) => {
  const promoId = req.params.promoId as string;
  const promo = await togglePromoCode(promoId);
  res.status(200).json({ promo });
});

export const removePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const promoId = req.params.promoId as string;
  await deletePromoCode(promoId);
  res.status(204).send();
});