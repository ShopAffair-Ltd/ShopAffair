import { api } from './api';
import { UserProfile } from '../types';

interface StartDraftPayload {
  email: string;
  password: string;
}

interface UpdateDraftPayload {
  username?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  role?: 'buyer' | 'seller';
  bankAccountNumber?: string;
  bankCode?: string;
}

interface ResolvedBankAccount {
  accountName: string;
  bankCode: string;
  bankName: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  user: Record<string, unknown>;
  token: string;
}

const mapToUserProfile = (raw: Record<string, unknown>): UserProfile => ({
  id: raw.id as string,
  tempId: raw.tempId as string,
  name: raw.name as string,
  username: raw.username as string,
  email: raw.email as string,
  role: raw.role as UserProfile['role'],
  verificationStatus: raw.verificationStatus as UserProfile['verificationStatus'],
  walletBalance: Number(raw.walletBalance ?? 0),
  isPro: Boolean(raw.isPro),
  avatarColor: raw.avatarColor as string,
  bankName: raw.bankName as string | undefined,
  accountNumber: raw.accountNumber as string | undefined,
  phoneNumber: raw.phoneNumber as string | undefined,
  profilePicture: raw.profilePicture as string | undefined,
  storeName: raw.storeName as string | undefined,
  bio: raw.bio as string | undefined,
  location: raw.location as string | undefined,
  storeCategory: raw.storeCategory as string | undefined,
  coverImage: raw.coverImage as string | undefined,
  totalTrades: raw.totalTrades as number | undefined,
  completedTrades: raw.completedTrades as number | undefined,
  completionRate: raw.completionRate !== undefined ? String(raw.completionRate) : undefined,
  tier: raw.tier as number | undefined,
  deliveryAddress: raw.deliveryAddress as string | undefined,
  createdAt: raw.createdAt as string,
  updatedAt: raw.updatedAt as string,
  lastSeenAt: raw.lastSeenAt as string | undefined,
  rejectionReason: raw.rejectionReason as string | undefined,
  verificationDocumentName: raw.verificationDocumentName as string | undefined,
  verificationSubmittedAt: raw.verificationSubmittedAt as string | undefined
});

export const startDraftRegistration = async (payload: StartDraftPayload): Promise<UserProfile> => {
  const { data } = await api.post<{ user: Record<string, unknown> }>('/auth/register/start', payload);
  return mapToUserProfile(data.user);
};

export const resolveBankAccount = async (accountNumber: string): Promise<ResolvedBankAccount[]> => {
  const { data } = await api.post<{ matches: ResolvedBankAccount[] }>('/auth/register/resolve-account', { accountNumber });
  return data.matches;
};

export const updateDraftRegistration = async (
  draftId: string,
  payload: UpdateDraftPayload
): Promise<UserProfile> => {
  const { data } = await api.post<{ user: Record<string, unknown> }>('/auth/register/update', {
    draftId,
    ...payload
  });
  return mapToUserProfile(data.user);
};

export const confirmDraftRegistration = async (draftId: string): Promise<UserProfile> => {
  const { data } = await api.post<AuthResponse>('/auth/register/confirm', { draftId });
  localStorage.setItem('shopfair_token', data.token);
  return mapToUserProfile(data.user);
};

export const loginUser = async (payload: LoginPayload): Promise<UserProfile> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  localStorage.setItem('shopfair_token', data.token);
  return mapToUserProfile(data.user);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const token = localStorage.getItem('shopfair_token');
  if (!token) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data } = await api.get<{ user: Record<string, unknown> }>('/users/me');
      return mapToUserProfile(data.user);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem('shopfair_token');
        return null;
      }

      if (attempt === 0) {
        await sleep(2000);
        continue;
      }

      return null;
    }
  }

  return null;
};

export const logoutUser = () => {
  localStorage.removeItem('shopfair_token');
};

export const getApiErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return 'Something went wrong. Please try again.';
};