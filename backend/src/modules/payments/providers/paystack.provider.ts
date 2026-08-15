import { env } from '../../../config/env';
import { ApiError } from '../../../utils/ApiError';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

const paystackRequest = async <T>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<PaystackResponse<T>> => {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const json = (await res.json()) as PaystackResponse<T>;

  if (!res.ok || json.status === false) {
    throw new ApiError(res.status >= 400 ? res.status : 502, json.message ?? 'Paystack request failed');
  }

  return json;
};

// ---- Checkout (works on any test key, used to fund wallet today) ----

interface InitializeTransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export const initializeTransaction = async (params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}) => {
  const { data } = await paystackRequest<InitializeTransactionData>('/transaction/initialize', {
    method: 'POST',
    body: {
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata
    }
  });
  return data;
};

interface VerifyTransactionData {
  status: 'success' | 'failed' | 'abandoned';
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer: { email: string };
  metadata: Record<string, unknown> | null;
}

export const verifyTransaction = async (reference: string) => {
  const { data } = await paystackRequest<VerifyTransactionData>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
  return data;
};

// ---- Dedicated Virtual Account (requires business approval from Paystack) ----

interface PaystackCustomerData {
  customer_code: string;
  id: number;
}

export const createOrFetchCustomer = async (params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}) => {
  const { data } = await paystackRequest<PaystackCustomerData>('/customer', {
    method: 'POST',
    body: {
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone
    }
  });
  return data;
};

interface DedicatedAccountData {
  account_number: string;
  account_name: string;
  bank: { name: string; slug: string };
  customer: { customer_code: string };
}

export const createDedicatedAccount = async (params: {
  customerCode: string;
  preferredBank?: string;
}) => {
  const { data } = await paystackRequest<DedicatedAccountData>('/dedicated_account', {
    method: 'POST',
    body: {
      customer: params.customerCode,
      preferred_bank: params.preferredBank ?? 'wema-bank'
    }
  });
  return data;
};

/**
 * Checks whether Dedicated Virtual Accounts are enabled for this Paystack business.
 * Returns false (instead of throwing) when the feature isn't available yet, so callers
 * can gracefully fall back to checkout-based funding.
 */
export const isDedicatedAccountAvailable = async (): Promise<boolean> => {
  try {
    await paystackRequest('/dedicated_account/available_providers');
    return true;
  } catch {
    return false;
  }
};

// ---- Bank resolution & transfers (withdrawals) ----

interface BankListItem {
  name: string;
  code: string;
  slug: string;
}

let cachedBanks: BankListItem[] | null = null;

/**
 * Full list of Nigerian banks with their Paystack bank codes. Cached in
 * memory for the process lifetime since this list changes rarely - avoids
 * hitting Paystack on every withdrawal form load.
 */
export const listBanks = async (): Promise<BankListItem[]> => {
  if (cachedBanks) return cachedBanks;
  const { data } = await paystackRequest<BankListItem[]>('/bank?country=nigeria');
  cachedBanks = data;
  return data;
};

interface ResolvedAccount {
  account_number: string;
  account_name: string;
  bank_id: number;
}

/**
 * Confirms an account number actually belongs to a real account at the given
 * bank, and returns the account holder's real name so the withdrawing user
 * can double check it before confirming - prevents money going to a
 * mistyped account number.
 */
export const resolveAccountNumber = async (accountNumber: string, bankCode: string) => {
  const { data } = await paystackRequest<ResolvedAccount>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
  );
  return data;
};

interface TransferRecipientData {
  recipient_code: string;
  active: boolean;
}

/**
 * One-time (per bank account) setup step: registers the withdrawal
 * destination with Paystack and returns a recipient_code to reuse on every
 * future withdrawal to that account.
 */
export const createTransferRecipient = async (params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}) => {
  const { data } = await paystackRequest<TransferRecipientData>('/transferrecipient', {
    method: 'POST',
    body: {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN'
    }
  });
  return data;
};

interface TransferData {
  transfer_code: string;
  reference: string;
  status: string;
  amount: number;
}


export const initiateTransfer = async (params: {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}) => {
  const { data } = await paystackRequest<TransferData>('/transfer', {
    method: 'POST',
    body: {
      source: 'balance',
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason ?? 'ShopFair wallet withdrawal'
    }
  });
  return data;
};