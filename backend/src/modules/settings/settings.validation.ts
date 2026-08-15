import { z } from 'zod';

export const setSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string()
});

export const broadcastSchema = z.object({
  message: z.string().min(1)
});

export const createPromoSchema = z.object({
  code: z.string().min(2),
  discountPct: z.number().int().min(1).max(100),
  expiresAt: z.string().datetime().optional()
});