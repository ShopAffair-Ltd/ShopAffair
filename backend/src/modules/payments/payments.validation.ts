import { z } from 'zod';

export const fundWalletSchema = z.object({
  amount: z.number().positive().min(100, 'Minimum funding amount is ₦100')
});

export const verifyFundingSchema = z.object({
  reference: z.string().min(1)
});

export const payFromWalletSchema = z.object({
  tradeId: z.string().uuid()
});

export const releaseEscrowSchema = z.object({
  pickupCode: z.string().min(1)
});

export const resolveAccountSchema = z.object({
  accountNumber: z.string().length(10),
  bankCode: z.string().min(1)
});

export const resolveAccountAllBanksSchema = z.object({
  accountNumber: z.string().length(10)
});

export const withdrawSchema = z.object({
  amount: z.number().positive().min(100, 'Minimum withdrawal amount is ₦100'),
  accountNumber: z.string().length(10),
  bankCode: z.string().min(1),
  bankName: z.string().min(1)
});

export const subscribeSchema = z.object({
  planId: z.enum(['TRIAL', 'STARTER'])
});

export const redeemSchema = z.object({
  code: z.string().min(3).max(30)
});

export type FundWalletInput = z.infer<typeof fundWalletSchema>;
export type VerifyFundingInput = z.infer<typeof verifyFundingSchema>;
export type PayFromWalletInput = z.infer<typeof payFromWalletSchema>;
export type ReleaseEscrowInput = z.infer<typeof releaseEscrowSchema>;
export type ResolveAccountInput = z.infer<typeof resolveAccountSchema>;
export type ResolveAccountAllBanksInput = z.infer<typeof resolveAccountAllBanksSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;