import { z } from 'zod';

export const checkoutItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().max(999)
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Cart is empty'),
  fullName: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  phone: z.string().min(5).max(30),
  deliveryFee: z.number().min(0).max(1_000_000).default(0)
});

const orderStatusEnum = z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: orderStatusEnum.optional(),
  role: z.enum(['buyer', 'seller']).default('buyer') // view as buyer or as seller
});

export const orderIdParamSchema = z.object({
  id: z.uuid()
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;