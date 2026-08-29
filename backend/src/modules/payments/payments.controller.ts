import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  fundWalletSchema,
  verifyFundingSchema,
  resolveAccountSchema,
  resolveAccountAllBanksSchema,
  withdrawSchema,
  subscribeSchema
} from './payments.validation';
import {
  initiateWalletFunding,
  verifyWalletFunding,
  provisionVirtualAccount,
  listWalletTransactions,
  getWalletBalance,
  getBankList,
  resolveWithdrawalAccount,
  resolveWithdrawalAccountAllBanks,
  requestWithdrawal,
  STORE_PLANS,
  subscribeToStorePlan,
  getSubscriptionStatus,
  listAllWithdrawals,
  listAllTransactions
} from './payments.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const fundWallet = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { amount } = fundWalletSchema.parse(req.body);
  const result = await initiateWalletFunding(user.id, amount);
  res.status(200).json(result);
});

export const verifyFunding = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { reference } = verifyFundingSchema.parse(req.query);
  const result = await verifyWalletFunding(user.id, reference);
  res.status(200).json(result);
});

export const generateVirtualAccount = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const account = await provisionVirtualAccount(user.id);
  res.status(200).json({ account });
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listWalletTransactions(user.id, page, limit);
  res.status(200).json(result);
});

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const balance = await getWalletBalance(user.id);
  res.status(200).json(balance);
});

export const getBanks = asyncHandler(async (_req: Request, res: Response) => {
  const banks = await getBankList();
  res.status(200).json({ banks });
});

export const resolveAccount = asyncHandler(async (req: Request, res: Response) => {
  requireUser(req);
  const { accountNumber, bankCode } = resolveAccountSchema.parse(req.body);
  const result = await resolveWithdrawalAccount(accountNumber, bankCode);
  res.status(200).json(result);
});

export const resolveAccountAllBanks = asyncHandler(async (req: Request, res: Response) => {
  requireUser(req);
  const { accountNumber } = resolveAccountAllBanksSchema.parse(req.body);
  const result = await resolveWithdrawalAccountAllBanks(accountNumber);
  res.status(200).json(result);
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { amount, accountNumber, bankCode, bankName } = withdrawSchema.parse(req.body);
  const result = await requestWithdrawal({
    userId: user.id,
    amountNaira: amount,
    accountNumber,
    bankCode,
    bankName
  });
  res.status(200).json(result);
});

export const getPlans = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ plans: Object.values(STORE_PLANS) });
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { planId } = subscribeSchema.parse(req.body);
  const subscription = await subscribeToStorePlan(user.id, planId);
  res.status(200).json({ subscription });
});

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const status = await getSubscriptionStatus(user.id);
  res.status(200).json(status);
});

export const getAllWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAllWithdrawals(page, limit);
  res.status(200).json(result);
});

export const getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAllTransactions(page, limit);
  res.status(200).json(result);
});