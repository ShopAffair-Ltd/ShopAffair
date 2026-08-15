import { z } from 'zod';

const conditionEnum = z.enum(['NEW', 'LIKE_NEW', 'GENTLY_USED', 'FAIR']);

export const createProductSchema = z.object({
  title: z.string().min(3).max(140),
  price: z.number().positive().max(100_000_000),
  image: z.url(),
  category: z.string().min(2).max(60),
  condition: conditionEnum,
  specs: z.record(z.string(), z.unknown()).optional(),
  description: z.string().min(10).max(5000)
});

export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().min(1).max(60).optional(),
  condition: conditionEnum.optional(),
  sellerId: z.uuid().optional(),
  search: z.string().min(1).max(120).optional()
});

export const productIdParamSchema = z.object({
  id: z.uuid()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;