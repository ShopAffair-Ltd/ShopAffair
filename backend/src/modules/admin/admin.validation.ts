import { z } from 'zod';

export const rejectCommunitySchema = z.object({
  reason: z.string().min(1, 'A rejection reason is required')
});

export const freezeUserSchema = z.object({
  reason: z.string().min(1, 'A reason is required to freeze an account')
});