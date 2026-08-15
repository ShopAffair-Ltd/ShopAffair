import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';

const generateTempId = () => `SHOPFAIR-${Math.floor(100000 + Math.random() * 900000)}`;

const generateToken = (userId: string, username: string, role: string) => {
  const payload = { id: userId, username, role };
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

import { provisionVirtualAccount } from '../payments/payments.service';

const DRAFT_TTL_MS = 30 * 60 * 1000;

export const startRegistrationDraft = async (input: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: {
      isDraft: false,
      OR: [{ email: input.email.toLowerCase() }, { username: input.username.toLowerCase() }]
    }
  });

  if (existing) {
    throw new ApiError(409, 'An account with that email or username already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  let user = await prisma.user.create({
    data: {
      tempId: generateTempId(),
      name: input.name,
      username: input.username.toLowerCase(),
      email: input.email.toLowerCase(),
      passwordHash,
      phoneNumber: input.phoneNumber,
      role: input.role,
      verificationStatus: 'UNVERIFIED',
      avatarColor: 'bg-purple-600',
      isDraft: true,
      draftExpiresAt: new Date(Date.now() + DRAFT_TTL_MS)
    }
  });

  try {
    await provisionVirtualAccount(user.id);
    user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  } catch (err) {
    console.error(`Could not provision virtual account for draft ${user.id}:`, err);
  }

  return user;
};

export const updateRegistrationDraft = async (draftId: string, input: Partial<RegisterInput>) => {
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

  const phoneChanged = input.phoneNumber && input.phoneNumber !== draft.phoneNumber;

  let user = await prisma.user.update({
    where: { id: draftId },
    data: {
      name: input.name,
      username: input.username?.toLowerCase(),
      email: input.email?.toLowerCase(),
      phoneNumber: input.phoneNumber,
      role: input.role,
      passwordHash,
      draftExpiresAt: new Date(Date.now() + DRAFT_TTL_MS)
    }
  });

  if (phoneChanged) {
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

export const registerUser = async (input: RegisterInput) => {
  const draft = await startRegistrationDraft(input);
  return confirmRegistration(draft.id);
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