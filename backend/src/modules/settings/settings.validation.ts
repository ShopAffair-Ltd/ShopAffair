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
  creditAmount: z.number().positive().max(1_000_000),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional()
});