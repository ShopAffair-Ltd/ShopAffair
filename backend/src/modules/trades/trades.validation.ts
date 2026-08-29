import { z } from 'zod';

const tradeTypeEnum = z.enum(['SUPPLY', 'REQUEST']);
const tradeCategoryEnum = z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']);
const tradeVisibilityEnum = z.enum(['PRIVATE', 'STORE', 'MARKET']);
const escrowStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'FUNDED',
  'DELIVERED',
  'COMPLETED',
  'DISPUTED',
  'REFUNDED'
]);

export const createTradeSchema = z.object({
  title: z.string().min(3).max(140),
  amount: z.number().positive().max(100_000_000),
  type: tradeTypeEnum,
  category: tradeCategoryEnum,
  visibility: tradeVisibilityEnum.default('MARKET'),
  condition: z.string().max(40).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  accountNumber: z.string().min(10).max(10).optional(),
  deliveryFee: z.number().min(0).max(1_000_000).default(0),
  deliveryTime: z.string().min(1).max(80),
  takeOffLocation: z.string().max(200).optional(),
  deliveryLocation: z.string().max(200).optional(),
  image: z.string().max(2_000_000).optional(),
  description: z.string().max(5000).optional()
});

export const updateTradeStatusSchema = z.object({
  status: escrowStatusEnum
});

export const editTradeSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  amount: z.number().positive().max(100_000_000).optional(),
  category: tradeCategoryEnum.optional(),
  visibility: tradeVisibilityEnum.optional(),
  condition: z.string().max(40).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  deliveryFee: z.number().min(0).max(1_000_000).optional(),
  deliveryTime: z.string().min(1).max(80).optional(),
  takeOffLocation: z.string().max(200).optional(),
  deliveryLocation: z.string().max(200).optional(),
  image: z.string().max(2_000_000).optional(),
  description: z.string().max(5000).optional()
});

export const listTradesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: escrowStatusEnum.optional(),
  type: tradeTypeEnum.optional(),
  category: tradeCategoryEnum.optional(),
  search: z.string().max(140).optional(),
  mine: z.coerce.boolean().optional(),
  storeOf: z.string().min(1).max(50).optional()
});

export const tradeIdParamSchema = z.object({
  id: z.uuid()
});

export const fundTradeSchema = z.object({
  accountNumber: z.string().min(10).max(10).optional()
});

export const verifyPickupCodeSchema = z.object({
  code: z.string().length(6)
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type EditTradeInput = z.infer<typeof editTradeSchema>;
export type ListTradesQuery = z.infer<typeof listTradesQuerySchema>;