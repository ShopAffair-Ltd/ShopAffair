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

export const isDedicatedAccountAvailable = async (): Promise<boolean> => {
  try {
    await paystackRequest('/dedicated_account/available_providers');
    return true;
  } catch {
    return false;
  }
};

interface BankListItem {
  name: string;
  code: string;
  slug: string;
}

let cachedBanks: BankListItem[] | null = null;

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

export const resolveAccountNumber = async (accountNumber: string, bankCode: string) => {
  const { data } = await paystackRequest<ResolvedAccount>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
  );
  return data;
};

const resolveAccountAtBank = async (accountNumber: string, bankCode: string) => {
  try {
    return await resolveAccountNumber(accountNumber, bankCode);
  } catch {
    return null;
  }
};

interface BankMatch {
  accountName: string;
  bankCode: string;
  bankName: string;
}

const POPULAR_BANK_CODES = new Set([
  '999992', // OPay
  '999991', // PalmPay
  '50211',  // Kuda
  '50515',  // Moniepoint MFB
  '058',    // GTBank
  '044',    // Access Bank
  '063',    // Access Bank (Diamond)
  '057',    // Zenith Bank
  '033',    // UBA
  '011',    // First Bank
  '070',    // Fidelity Bank
  '035',    // Wema Bank
  '232',    // Sterling Bank
  '221',    // Stanbic IBTC
  '032',    // Union Bank
  '214',    // FCMB
  '050',    // Ecobank
  '076',    // Polaris Bank
  '215',    // Unity Bank
  '301',    // Jaiz Bank
  '101',    // Providus Bank
  '100',    // Suntrust Bank
  '102',    // Titan Trust Bank
  '090267', // Kuda (alt code)
  '090405', // Moniepoint (alt code)
]);

const resolveCache = new Map<string, { data: BankMatch[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export const resolveAccountAllBanks = async (accountNumber: string): Promise<BankMatch[]> => {
  const cached = resolveCache.get(accountNumber);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const banks = await listBanks();
  const popularBanks = banks.filter((b) => POPULAR_BANK_CODES.has(b.code));
  const otherBanks = banks.filter((b) => !POPULAR_BANK_CODES.has(b.code));

  const probeBatch = async (batch: typeof banks): Promise<BankMatch[]> => {
    const results = await Promise.all(
      batch.map(async (bank) => {
        const resolved = await resolveAccountAtBank(accountNumber, bank.code);
        return resolved
          ? { accountName: resolved.account_name, bankCode: bank.code, bankName: bank.name }
          : null;
      })
    );
    return results.filter((r): r is BankMatch => r !== null);
  };

  let matches = await probeBatch(popularBanks);
  if (matches.length === 0 && otherBanks.length > 0) {
    matches = await probeBatch(otherBanks);
  }

  resolveCache.set(accountNumber, { data: matches, expiresAt: Date.now() + CACHE_TTL_MS });

  return matches;
};

interface TransferRecipientData {
  recipient_code: string;
  active: boolean;
}

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