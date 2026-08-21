import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import * as paystack from '../payments/providers/paystack.provider.js';
import type { LoginInput, updateDraftSchema, startDraftSchema } from './auth.validation.js';
import type { z } from 'zod';
import { provisionVirtualAccount } from '../payments/payments.service';

const generateTempId = () => `SHOPFAIR-${Math.floor(100000 + Math.random() * 900000)}`;

const generateToken = (userId: string, username: string, role: string) => {
  const payload = { id: userId, username, role };
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

const DRAFT_TTL_MS = 30 * 60 * 1000;

type StartDraftInput = z.infer<typeof startDraftSchema>;
type UpdateDraftInput = z.infer<typeof updateDraftSchema>;

export const startRegistrationDraft = async (input: StartDraftInput) => {
  const existing = await prisma.user.findFirst({
    where: {
      isDraft: false,
      email: input.email.toLowerCase()
    }
  });

  if (existing) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      tempId: generateTempId(),
      name: '',
      username: `pending_${generateTempId().toLowerCase()}`,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'buyer',
      verificationStatus: 'UNVERIFIED',
      avatarColor: 'bg-purple-600',
      isDraft: true,
      draftExpiresAt: new Date(Date.now() + DRAFT_TTL_MS)
    }
  });

  return user;
};

export const resolveBankAccount = async (accountNumber: string) => {
  const matches = await paystack.resolveAccountAllBanks(accountNumber);
  if (matches.length === 0) {
    throw new ApiError(
      404,
      'Could not verify this account number against any supported bank. Please check the number and try again.'
    );
  }
  return matches;
};

const suggestUsernameFromName = async (fullName: string): Promise<string> => {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('_')
    .slice(0, 24);

  const fallbackBase = base || 'user';

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? fallbackBase : `${fallbackBase}${Math.floor(100 + Math.random() * 900)}`;
    const taken = await prisma.user.findFirst({
      where: { username: candidate, isDraft: false }
    });
    if (!taken) return candidate;
  }

  return `${fallbackBase}${Date.now().toString().slice(-6)}`;
};

export const updateRegistrationDraft = async (draftId: string, input: Omit<UpdateDraftInput, 'draftId'>) => {
  const draft = await prisma.user.findUnique({ where: { id: draftId } });
  if (!draft || !draft.isDraft) {
    throw new ApiError(404, 'Registration draft not found or already confirmed');
  }

  if (input.email || input.username) {
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: draftId },
        isDraft: false,
        OR: [
          input.email ? { email: input.email.toLowerCase() } : undefined,
          input.username ? { username: input.username.toLowerCase() } : undefined
        ].filter((clause): clause is NonNullable<typeof clause> => Boolean(clause))
      }
    });
    if (conflict) {
      throw new ApiError(409, 'An account with that email or username already exists');
    }
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;

  let resolvedName: string | undefined;
  let resolvedBankName: string | undefined;
  let usernameToSet = input.username?.toLowerCase();

  if (input.bankAccountNumber) {
    if (!input.bankCode) {
      throw new ApiError(400, 'Please select which bank this account number belongs to');
    }

    const matches = await resolveBankAccount(input.bankAccountNumber);
    const selected = matches.find((m) => m.bankCode === input.bankCode);

    if (!selected) {
      throw new ApiError(400, 'That bank does not match this account number. Please verify again.');
    }

    resolvedName = selected.accountName;
    resolvedBankName = selected.bankName;

    if (!usernameToSet) {
      usernameToSet = await suggestUsernameFromName(resolvedName);
    }
  }

  const phoneChanged = input.phoneNumber && input.phoneNumber !== draft.phoneNumber;
  const bankAccountChanged = Boolean(input.bankAccountNumber);

  let user = await prisma.user.update({
    where: { id: draftId },
    data: {
      name: resolvedName ?? undefined,
      username: usernameToSet,
      email: input.email?.toLowerCase(),
      phoneNumber: input.phoneNumber,
      role: input.role,
      passwordHash,
      draftExpiresAt: new Date(Date.now() + DRAFT_TTL_MS)
    }
  });

  if (phoneChanged || bankAccountChanged) {
    try {
      await provisionVirtualAccount(user.id);
      user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    } catch (err) {
      console.error(`Could not re-provision virtual account for draft ${user.id}:`, err);
    }
  }

  return user;
};

export const confirmRegistration = async (draftId: string) => {
  const draft = await prisma.user.findUnique({ where: { id: draftId } });
  if (!draft || !draft.isDraft) {
    throw new ApiError(404, 'Registration draft not found or already confirmed');
  }

  if (!draft.name || draft.username.startsWith('pending_') || !draft.phoneNumber) {
    throw new ApiError(400, 'Please complete your bank verification and profile details before continuing');
  }

  const user = await prisma.user.update({
    where: { id: draftId },
    data: { isDraft: false, draftExpiresAt: null }
  });

  const token = generateToken(user.id, user.username, user.role);
  return { user, token };
};

export const cleanupExpiredDrafts = async () => {
  const result = await prisma.user.deleteMany({
    where: { isDraft: true, draftExpiresAt: { lt: new Date() } }
  });
  return result.count;
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isFrozen) {
    throw new ApiError(403, user.frozenReason || 'This account has been suspended. Contact support for details.');
  }

  const token = generateToken(user.id, user.username, user.role);
  return { user, token };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};