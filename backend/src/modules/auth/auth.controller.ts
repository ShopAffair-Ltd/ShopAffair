import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { startDraftSchema, resolveAccountSchema, loginSchema, updateDraftSchema, confirmDraftSchema } from './auth.validation';
import { startRegistrationDraft, resolveBankAccount, updateRegistrationDraft, confirmRegistration, loginUser, getUserById } from './auth.service';

const sanitizeUser = (user: Record<string, unknown>) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

export const startDraft = asyncHandler(async (req: Request, res: Response) => {
  const input = startDraftSchema.parse(req.body);
  const user = await startRegistrationDraft(input);
  res.status(201).json({ user: sanitizeUser(user) });
});

export const resolveAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber } = resolveAccountSchema.parse(req.body);
  const matches = await resolveBankAccount(accountNumber);
  res.status(200).json({ matches });
});

export const updateDraft = asyncHandler(async (req: Request, res: Response) => {
  const { draftId, ...rest } = updateDraftSchema.parse(req.body);
  const user = await updateRegistrationDraft(draftId, rest);
  res.status(200).json({ user: sanitizeUser(user) });
});

export const confirmDraft = asyncHandler(async (req: Request, res: Response) => {
  const { draftId } = confirmDraftSchema.parse(req.body);
  const { user, token } = await confirmRegistration(draftId);
  res.status(200).json({ user: sanitizeUser(user), token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { user, token } = await loginUser(input);
  res.status(200).json({ user: sanitizeUser(user), token });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  const user = await getUserById(userId);
  res.status(200).json({ user: sanitizeUser(user) });
});