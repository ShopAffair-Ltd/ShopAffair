import crypto from 'crypto';
import { prisma } from '../../config/db';
import { Prisma } from '../../generated/prisma/client.js';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';
import * as paystack from './providers/paystack.provider';

const generateReference = () => `SF-FUND-${crypto.randomBytes(8).toString('hex')}`;

// ---- Wallet funding via Paystack checkout (works today on test keys) ----

/**
 * Starts a wallet-funding flow: creates a PENDING WalletTransaction and asks
 * Paystack for a checkout URL. The wallet is NOT credited yet — that only
 * happens once the webhook (or verifyFunding fallback) confirms the charge
 * actually succeeded, so a user can never credit themselves by just hitting
 * this endpoint without paying.
 */
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
    callbackUrl: `${env.CLIENT_URL}/wallet/callback`,
    metadata: { userId, purpose: 'wallet_funding' }
  });

  return { authorizationUrl: authorization_url, accessCode: access_code, reference };
};

/**
 * Confirms a funding transaction directly against Paystack's verify endpoint
 * and credits the wallet if (and only if) it hasn't already been credited.
 * This is a fallback path for when the client redirects back before the
 * webhook has landed - the webhook remains the source of truth in production,
 * this just lets the frontend show an immediate result. Idempotent: calling
 * it twice on an already-SUCCESS transaction is a no-op, not a double credit.
 */
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
    // Re-check inside the transaction in case the webhook landed in the gap
    // between our read above and this write.
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

/**
 * Called from the Paystack webhook handler once signature verification has
 * passed. Same idempotency guarantee as verifyWalletFunding: safe to call
 * more than once for the same reference (Paystack does retry webhooks).
 */
export const creditWalletFromWebhook = async (reference: string, amountKobo: number) => {
  const updated = await prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.findUnique({ where: { reference } });

    if (!transaction) {
      // Unknown reference - not one of ours, or funding record was never
      // created. Nothing to credit; log and move on rather than throwing,
      // since throwing here would make Paystack retry forever.
      return null;
    }

    if (transaction.status === 'SUCCESS') {
      return null; // already credited via this path or the verify fallback - don't notify twice
    }

    const expectedKobo = Math.round(Number(transaction.amount) * 100);
    if (expectedKobo !== amountKobo) {
      // Amount mismatch between what we expected and what Paystack says was
      // paid - do not credit blindly, flag as failed for manual review.
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

// ---- Dedicated Virtual Account provisioning ----

/**
 * Attempts to provision a permanent virtual account number for the user so
 * they can fund their wallet by bank transfer instead of the checkout flow.
 * Until Paystack approves this business for Dedicated NUBAN, this will
 * throw a 422 with a clear explanation rather than a raw Paystack error -
 * callers (controller) should surface that as "not available yet".
 */
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

// ---- Withdrawals (wallet balance -> bank) ----

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

// ---- Withdrawals: bank list, account resolution, recipient setup, transfer ----

export const getBankList = async () => {
  return paystack.listBanks();
};

/**
 * Verifies the account number/bank pair resolves to a real account and
 * returns the account holder's name, without saving anything yet - the
 * frontend shows this name so the user can confirm before we commit to it.
 */
export const resolveWithdrawalAccount = async (accountNumber: string, bankCode: string) => {
  const resolved = await paystack.resolveAccountNumber(accountNumber, bankCode);
  return { accountName: resolved.account_name, accountNumber: resolved.account_number };
};

const generateWithdrawalReference = () => `SF-WD-${crypto.randomBytes(8).toString('hex')}`;

/**
 * Debits the wallet immediately and kicks off a Paystack transfer.
 * The debit happens up front (optimistic) rather than after transfer
 * confirmation, because transfers are asynchronous by design - if we waited
 * for confirmation before debiting, a user could spend the same balance
 * twice while a transfer is still in flight. If the transfer later fails
 * (transfer.failed / transfer.reversed webhook), the wallet is refunded.
 */
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

  // Confirm the account is real before we ever touch the wallet balance.
  const resolved = await paystack.resolveAccountNumber(accountNumber, bankCode);

  // Reuse an existing Paystack recipient for this exact account if the user
  // has withdrawn to it before; otherwise register a new one and save it.
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
    // Re-check balance inside the transaction to guard against a
    // concurrent withdrawal request racing this one.
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

    // Test mode returns success immediately; live mode returns pending and
    // the real result arrives via webhook. Only mark SUCCESS here if
    // Paystack already told us it succeeded synchronously.
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
    // The Paystack call itself failed (not just a later async failure) -
    // refund immediately rather than leaving the user's money in limbo.
    await refundFailedWithdrawal(reference);
    throw err;
  }
};

/**
 * Refunds a withdrawal back to the wallet and marks it FAILED. Idempotent:
 * safe to call more than once for the same reference (e.g. once from the
 * synchronous error path and again from a later webhook retry).
 */
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

/**
 * Called from the webhook when Paystack confirms a transfer actually
 * succeeded (transfer.success) or ultimately failed/reversed
 * (transfer.failed / transfer.reversed).
 */
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

// ---- Seller Pro subscription (unlocks community/group creation) ----

// One-time price for now - kept as a constant here rather than hardcoded at
// each call site so it's a single place to change when this becomes
// recurring or tiered later.
export const SELLER_PRO_PRICE = 5000;

const generateSubscriptionReference = () => `SF-SUB-${crypto.randomBytes(8).toString('hex')}`;

/**
 * Charges the seller's wallet balance for the Seller Pro plan and marks
 * them isPro. One-time payment for now (Subscription.expiresAt stays null),
 * deliberately modeled with an expiry field from day one so switching to a
 * recurring plan later doesn't need a schema change - just start setting
 * expiresAt and checking it.
 */
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
    // Re-check balance and isPro inside the transaction to guard against a
    // double-submit racing this same request.
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