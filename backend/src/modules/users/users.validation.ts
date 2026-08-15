import { z } from 'zod';

export const updateStoreProfileSchema = z.object({
  storeName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  storeCategory: z.string().max(60).optional(),
  coverImage: z.url().optional()
});

export const usernameParamSchema = z.object({
  username: z.string().min(1)
});

export type UpdateStoreProfileInput = z.infer<typeof updateStoreProfileSchema>;