import { z } from 'zod';

export const toggleFavoriteSchema = z.object({
  productId: z.uuid().optional(),
  tradeId: z.uuid().optional()
}).refine((data) => (!!data.productId) !== (!!data.tradeId), {
  message: 'Provide exactly one of productId or tradeId'
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
