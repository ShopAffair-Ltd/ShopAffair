import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  email: z.email(),
  password: z.string().min(8).max(72),
  phoneNumber: z.string().min(10).max(15),
  role: z.enum(['buyer', 'seller']).default('buyer')
});

export const startDraftSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72)
});

export const resolveAccountSchema = z.object({
  accountNumber: z.string().min(10).max(10)
});

export const updateDraftSchema = registerSchema
  .omit({ name: true })
  .partial()
  .extend({
    draftId: z.string().uuid(),
    bankAccountNumber: z.string().min(10).max(10).optional(),
    bankCode: z.string().min(1).optional()
  });

export const confirmDraftSchema = z.object({
  draftId: z.string().uuid()
});

export const verifySignupOtpSchema = z.object({
  draftId: z.string().uuid(),
  code: z.string().length(6)
});

export const resendOtpSchema = z.object({
  draftId: z.string().uuid()
});

export const requestPasswordResetSchema = z.object({
  email: z.email()
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(72)
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;