import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendOtpEmail } from './email.service';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const hashCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

export const issueOtp = async (email: string, purpose: 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET') => {
  const code = generateCode();
  const codeHash = hashCode(code);

  await prisma.otp.create({
    data: {
      email: email.toLowerCase(),
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS)
    }
  });

  await sendOtpEmail({
    to: email,
    code,
    purpose: purpose === 'SIGNUP_VERIFICATION' ? 'signup' : 'reset'
  });
};

export const verifyOtp = async (
  email: string,
  code: string,
  purpose: 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET'
) => {
  const otp = await prisma.otp.findFirst({
    where: {
      email: email.toLowerCase(),
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otp) {
    throw new ApiError(400, 'This code has expired or is invalid. Please request a new one.');
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(429, 'Too many incorrect attempts. Please request a new code.');
  }

  const codeHash = hashCode(code);

  if (codeHash !== otp.codeHash) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } }
    });
    throw new ApiError(400, 'Incorrect code. Please try again.');
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() }
  });
};