import { api } from './api';

export interface FundWalletResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

// Starts a wallet-funding flow. The backend creates a PENDING transaction and
// returns a Paystack checkout URL - redirect the user there (same tab, since
// Paystack redirects back to callbackUrl/CLIENT_URL on completion). The
// wallet balance does NOT change yet; it only updates once verifyFunding (or
// the server-side webhook) confirms the charge actually succeeded.
export const fundWallet = async (amount: number): Promise<FundWalletResult> => {
  const { data } = await api.post<FundWalletResult>('/payments/wallet/fund', { amount });
  return data;
};

export interface WalletTransaction {
  id: string;
  type: 'FUNDING' | 'WITHDRAWAL' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND';
  provider: 'MANUAL' | 'PAYSTACK' | 'KUDA';
  amount: string | number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  reference?: string | null;
  tradeId?: string | null;
  createdAt: string;
}

export interface VerifyFundingResult {
  alreadyProcessed: boolean;
  transaction: WalletTransaction;
}

// Call this when the user is redirected back from Paystack checkout (read
// `reference` off the callback URL's query string). Safe to call more than
// once for the same reference - the backend only credits the wallet once.
export const verifyFunding = async (reference: string): Promise<VerifyFundingResult> => {
  const { data } = await api.get<VerifyFundingResult>('/payments/wallet/verify', {
    params: { reference }
  });
  return data;
};

export interface VirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

// Attempts to provision a permanent virtual account number for bank-transfer
// funding. Throws a 422 (via axios error) with a clear message if Paystack
// hasn't enabled Dedicated NUBAN for this business yet - callers should
// catch that and fall back to fundWallet() (checkout link) instead.
export const generateVirtualAccount = async (): Promise<VirtualAccount> => {
  const { data } = await api.post<{ account: VirtualAccount }>('/payments/wallet/virtual-account');
  return data.account;
};

export interface WalletBalance {
  walletBalance: string | number;
  accountNumber: string | null;
  bankName: string | null;
}

export const fetchWalletBalance = async (): Promise<WalletBalance> => {
  const { data } = await api.get<WalletBalance>('/payments/wallet/balance');
  return data;
};

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
}

export interface ListTransactionsResult {
  items: WalletTransaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const fetchWalletTransactions = async (
  params: ListTransactionsParams = {}
): Promise<ListTransactionsResult> => {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);

  const { data } = await api.get<ListTransactionsResult>('/payments/wallet/transactions', {
    params: query
  });
  return data;
};

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

export const fetchBanks = async (): Promise<Bank[]> => {
  const { data } = await api.get<{ banks: Bank[] }>('/payments/wallet/banks');
  return data.banks;
};

export interface ResolvedAccount {
  accountName: string;
  accountNumber: string;
}

// Confirms an account number/bank pair is real before the user commits to
// a withdrawal, and returns the account holder's name so they can visually
// verify it matches who they intend to pay.
export const resolveAccount = async (accountNumber: string, bankCode: string): Promise<ResolvedAccount> => {
  const { data } = await api.post<ResolvedAccount>('/payments/wallet/resolve-account', {
    accountNumber,
    bankCode
  });
  return data;
};

export interface WithdrawResult {
  transferStatus: string;
  accountName: string;
}

export const withdraw = async (params: {
  amount: number;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}): Promise<WithdrawResult> => {
  const { data } = await api.post<WithdrawResult>('/payments/wallet/withdraw', params);
  return data;
};


export const SELLER_PRO_PRICE = 5000;
export const SELLER_PRO_PRICE_DISPLAY = `₦${SELLER_PRO_PRICE.toLocaleString()}`;

export interface SubscriptionStatus {
  isPro: boolean;
  subscription: {
    id: string;
    plan: string;
    amount: string | number;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
  } | null;
}

export const fetchSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const { data } = await api.get<SubscriptionStatus>('/payments/subscription');
  return data;
};


export const subscribeToSellerPro = async (): Promise<void> => {
  await api.post('/payments/subscription');
};