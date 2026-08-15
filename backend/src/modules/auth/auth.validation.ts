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

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;