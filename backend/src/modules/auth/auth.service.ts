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

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] }
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
      avatarColor: 'bg-purple-600'
    }
  });

  // Synchronous: the account must exist before the response goes out, so
  // the signup success screen can show the real deposit account number
  // immediately. If Paystack is briefly unavailable, registration itself
  // still succeeds - the user just doesn't get a number yet, and the
  // wallet screen's existing retry path (DepositModal) covers that case.
  try {
    await provisionVirtualAccount(user.id);
    user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  } catch (err) {
    console.error(`Could not provision virtual account for new user ${user.id}:`, err);
  }

  const token = generateToken(user.id, user.username, user.role);
  return { user, token };
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