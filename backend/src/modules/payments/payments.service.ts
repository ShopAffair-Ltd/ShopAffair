import crypto from 'crypto';
import { prisma } from '../../config/db';
import { Prisma } from '../../generated/prisma/client.js';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';
import { namesLikelyMatch } from '../../utils/nameMatch';
import * as paystack from './providers/paystack.provider';

const generateReference = () => `SF-FUND-${crypto.randomBytes(8).toString('hex')}`;

export const initiateWalletFunding = async (userId: string, amountNaira: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const reference = generateReference();
  const amountKobo = Math.round(amountNaira * 100);

  await prisma.walletTransaction.create({
    data: {
      userId,
      type: 'FUNDING',
      provider: 'PAYSTACK',
      amount: amountNaira,
      status: 'PENDING',
      reference
    }
  });

  const { authorization_url, access_code } = await paystack.initializeTransaction({
    email: user.email,
    amountKobo,
    reference,
    callbackUrl: 'https://shops-lake.vercel.app/wallet/callback',
    metadata: { userId, purpose: 'wallet_funding' }
  });

  return { authorizationUrl: authorization_url, accessCode: access_code, reference };
};

export const verifyWalletFunding = async (userId: string, reference: string) => {
  const transaction = await prisma.walletTransaction.findUnique({ where: { reference } });

  if (!transaction || transaction.userId !== userId) {
    throw new ApiError(404, 'Funding transaction not found');
  }

  if (transaction.status === 'SUCCESS') {
    return { alreadyProcessed: true, transaction };
  }

  const verified = await paystack.verifyTransaction(reference);

  if (verified.status !== 'success') {
    await prisma.walletTransaction.update({
      where: { reference },
      data: { status: 'FAILED' }
    });
    throw new ApiError(400, `Payment was not successful (status: ${verified.status})`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.walletTransaction.findUnique({ where: { reference } });
    if (!current || current.status === 'SUCCESS') {
      return { transaction: current };
    }

    const updated = await tx.walletTransaction.update({
      where: { reference },
      data: { status: 'SUCCESS' }
    });

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: updated.amount } }
    });

    return { transaction: updated };
  });

  if (result.transaction) {
    await notify({
      userId,
      title: 'Wallet funded',
      message: `₦${Number(result.transaction.amount).toLocaleString()} has been added to your wallet.`,
      type: 'SUCCESS'
    });
  }

  return { alreadyProcessed: false, transaction: result.transaction };
};

export const creditWalletFromWebhook = async (reference: string, amountKobo: number) => {
  const updated = await prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.findUnique({ where: { reference } });

    if (!transaction) {
      return null;
    }

    if (transaction.status === 'SUCCESS') {
      return null;
    }

    const expectedKobo = Math.round(Number(transaction.amount) * 100);
    if (expectedKobo !== amountKobo) {
      await tx.walletTransaction.update({ where: { reference }, data: { status: 'FAILED' } });
      return null;
    }

    const result = await tx.walletTransaction.update({
      where: { reference },
      data: { status: 'SUCCESS' }
    });

    await tx.user.update({
      where: { id: transaction.userId },
      data: { walletBalance: { increment: result.amount } }
    });

    return result;
  });

  if (updated) {
    await notify({
      userId: updated.userId,
      title: 'Wallet funded',
      message: `₦${Number(updated.amount).toLocaleString()} has been added to your wallet.`,
      type: 'SUCCESS'
    });
  }

  return updated;
};

export const creditWalletFromDvaWebhook = async (params: {
  reference: string;
  amountKobo: number;
  receiverAccountNumber: string | undefined;
}) => {
  const { reference, amountKobo, receiverAccountNumber } = params;

  if (!receiverAccountNumber) {
    console.error(`DVA webhook missing receiver_account_number for reference ${reference}`);
    return null;
  }

  const existing = await prisma.walletTransaction.findUnique({ where: { reference } });
  if (existing) {
    return null;
  }

  const user = await prisma.user.findFirst({ where: { accountNumber: receiverAccountNumber } });
  if (!user) {
    console.error(`DVA webhook: no user found for account number ${receiverAccountNumber} (reference ${reference})`);
    return null;
  }

  const amountNaira = amountKobo / 100;

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'FUNDING',
        provider: 'PAYSTACK',
        amount: amountNaira,
        status: 'SUCCESS',
        reference
      }
    });

    await tx.user.update({
      where: { id: user.id },
      data: { walletBalance: { increment: amountNaira } }
    });

    return created;
  });

  await notify({
    userId: user.id,
    title: 'Wallet funded',
    message: `₦${amountNaira.toLocaleString()} has been added to your wallet.`,
    type: 'SUCCESS'
  });

  return result;
};

export const provisionVirtualAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.phoneNumber) {
    throw new ApiError(400, 'Please add a phone number to your profile before generating a virtual account');
  }

  const available = await paystack.isDedicatedAccountAvailable();
  if (!available) {
    throw new ApiError(
      422,
      'Virtual account generation is not enabled on this Paystack account yet. Use "Fund via card/transfer" instead for now.'
    );
  }

  const [firstName, ...rest] = user.name.split(' ');
  const lastName = rest.join(' ') || firstName;

  const customer = await paystack.createOrFetchCustomer({
    email: user.email,
    firstName,
    lastName,
    phone: user.phoneNumber
  });

  const account = await paystack.createDedicatedAccount({ customerCode: customer.customer_code });

  await prisma.user.update({
    where: { id: userId },
    data: {
      accountNumber: account.account_number,
      bankName: account.bank.name
    }
  });

  return {
    accountNumber: account.account_number,
    accountName: account.account_name,
    bankName: account.bank.name
  };
};

export const listWalletTransactions = async (userId: string, page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.walletTransaction.count({ where: { userId } })
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getWalletBalance = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true, accountNumber: true, bankName: true }
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const getBankList = async () => {
  return paystack.listBanks();
};

export const resolveWithdrawalAccount = async (accountNumber: string, bankCode: string) => {
  const resolved = await paystack.resolveAccountNumber(accountNumber, bankCode);
  return { accountName: resolved.account_name, accountNumber: resolved.account_number };
};

export const resolveWithdrawalAccountAllBanks = async (accountNumber: string) => {
  const matches = await paystack.resolveAccountAllBanks(accountNumber);
  if (matches.length === 0) {
    throw new ApiError(404, 'Could not find any bank for this account number');
  }
  return { matches };
};

const generateWithdrawalReference = () => `SF-WD-${crypto.randomBytes(8).toString('hex')}`;

export const requestWithdrawal = async (params: {
  userId: string;
  amountNaira: number;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}) => {
  const { userId, amountNaira, accountNumber, bankCode, bankName } = params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (new Prisma.Decimal(user.walletBalance).lessThan(amountNaira)) {
    throw new ApiError(402, 'Insufficient wallet balance');
  }

  const resolved = await paystack.resolveAccountNumber(accountNumber, bankCode);

  if (!namesLikelyMatch(resolved.account_name, user.name)) {
    throw new ApiError(
      403,
      `This account is registered to "${resolved.account_name}", which doesn't match your account name. ` +
        `Withdrawals are only allowed to an account in your own name.`
    );
  }

  let recipientCode = user.paystackRecipientCode;
  const isSameAccountAsBefore =
    user.withdrawalAccountNumber === accountNumber && user.withdrawalBankCode === bankCode;

  if (!recipientCode || !isSameAccountAsBefore) {
    const recipient = await paystack.createTransferRecipient({
      name: resolved.account_name,
      accountNumber,
      bankCode
    });
    recipientCode = recipient.recipient_code;
  }

  const reference = generateWithdrawalReference();

  const { transaction } = await prisma.$transaction(async (tx) => {
    const fresh = await tx.user.findUnique({ where: { id: userId } });
    if (!fresh || new Prisma.Decimal(fresh.walletBalance).lessThan(amountNaira)) {
      throw new ApiError(402, 'Insufficient wallet balance');
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: { decrement: amountNaira },
        paystackRecipientCode: recipientCode,
        withdrawalAccountNumber: accountNumber,
        withdrawalAccountName: resolved.account_name,
        withdrawalBankCode: bankCode,
        withdrawalBankName: bankName
      }
    });

    const created = await tx.walletTransaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        provider: 'PAYSTACK',
        amount: amountNaira,
        status: 'PENDING',
        reference
      }
    });

    return { transaction: created };
  });

  try {
    const transfer = await paystack.initiateTransfer({
      amountKobo: Math.round(amountNaira * 100),
      recipientCode: recipientCode!,
      reference,
      reason: `Wallet withdrawal for ${user.username}`
    });

    if (transfer.status === 'success') {
      await prisma.walletTransaction.update({
        where: { reference },
        data: { status: 'SUCCESS' }
      });
      await notify({
        userId,
        title: 'Withdrawal successful',
        message: `₦${amountNaira.toLocaleString()} was sent to ${resolved.account_name} (${bankName}).`,
        type: 'SUCCESS'
      });
    } else {
      await notify({
        userId,
        title: 'Withdrawal processing',
        message: `Your withdrawal of ₦${amountNaira.toLocaleString()} to ${resolved.account_name} is being processed.`,
        type: 'INFO'
      });
    }

    return { transaction, transferStatus: transfer.status, accountName: resolved.account_name };
  } catch (err) {
    await refundFailedWithdrawal(reference);
    throw err;
  }
};

export const refundFailedWithdrawal = async (reference: string) => {
  const updated = await prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.findUnique({ where: { reference } });
    if (!transaction || transaction.status !== 'PENDING') {
      return null;
    }

    const result = await tx.walletTransaction.update({
      where: { reference },
      data: { status: 'FAILED' }
    });

    await tx.user.update({
      where: { id: transaction.userId },
      data: { walletBalance: { increment: result.amount } }
    });

    return result;
  });

  if (updated) {
    await notify({
      userId: updated.userId,
      title: 'Withdrawal failed',
      message: `Your withdrawal of ₦${Number(updated.amount).toLocaleString()} could not be completed and has been refunded to your wallet.`,
      type: 'WARNING'
    });
  }

  return updated;
};

export const handleTransferWebhookEvent = async (event: string, reference: string) => {
  if (event === 'transfer.success') {
    const transaction = await prisma.walletTransaction.findUnique({ where: { reference } });
    if (transaction && transaction.status === 'PENDING') {
      await prisma.walletTransaction.update({ where: { reference }, data: { status: 'SUCCESS' } });
      await notify({
        userId: transaction.userId,
        title: 'Withdrawal successful',
        message: `₦${Number(transaction.amount).toLocaleString()} has been sent to your bank account.`,
        type: 'SUCCESS'
      });
    }
    return;
  }

  if (event === 'transfer.failed' || event === 'transfer.reversed') {
    await refundFailedWithdrawal(reference);
  }
};

export const SELLER_PRO_PRICE = 5000;

const generateSubscriptionReference = () => `SF-SUB-${crypto.randomBytes(8).toString('hex')}`;

export const subscribeToSellerPro = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.role !== 'seller') {
    throw new ApiError(403, 'Only sellers can subscribe to Seller Pro');
  }
  if (user.isPro) {
    throw new ApiError(409, 'You already have an active Seller Pro subscription');
  }
  if (new Prisma.Decimal(user.walletBalance).lessThan(SELLER_PRO_PRICE)) {
    throw new ApiError(402, `Insufficient wallet balance. Seller Pro costs ₦${SELLER_PRO_PRICE.toLocaleString()}.`);
  }

  const reference = generateSubscriptionReference();

  const subscription = await prisma.$transaction(async (tx) => {
    const fresh = await tx.user.findUnique({ where: { id: userId } });
    if (!fresh || fresh.isPro) {
      throw new ApiError(409, 'You already have an active Seller Pro subscription');
    }
    if (new Prisma.Decimal(fresh.walletBalance).lessThan(SELLER_PRO_PRICE)) {
      throw new ApiError(402, 'Insufficient wallet balance');
    }

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: SELLER_PRO_PRICE }, isPro: true }
    });

    await tx.walletTransaction.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        provider: 'MANUAL',
        amount: SELLER_PRO_PRICE,
        status: 'SUCCESS',
        reference
      }
    });

    return tx.subscription.create({
      data: {
        userId,
        plan: 'SELLER_PRO',
        amount: SELLER_PRO_PRICE,
        reference,
        expiresAt: null
      }
    });
  });

  await notify({
    userId,
    title: 'Seller Pro activated',
    message: `You're now a Seller Pro member. You can create and manage community groups.`,
    type: 'SUCCESS'
  });

  return subscription;
};

export const getSubscriptionStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true }
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const latest = await prisma.subscription.findFirst({
    where: { userId, active: true },
    orderBy: { createdAt: 'desc' }
  });

  return { isPro: user.isPro, subscription: latest };
};

export const listAllWithdrawals = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { type: 'WITHDRAWAL' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { username: true, name: true, withdrawalBankName: true, withdrawalAccountNumber: true, withdrawalAccountName: true } } }
    }),
    prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL' } })
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const listAllTransactions = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { username: true } } }
    }),
    prisma.walletTransaction.count()
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};