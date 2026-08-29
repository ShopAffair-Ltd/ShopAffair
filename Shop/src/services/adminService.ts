import { api } from './api';

export interface PendingCommunity {
  id: string;
  name: string | null;
  description: string | null;
  createdAt: string;
  creator: { id: string; username: string; name: string; isPro: boolean };
  _count: { participants: number };
}

export const fetchPendingCommunities = async (): Promise<PendingCommunity[]> => {
  const { data } = await api.get<{ communities: PendingCommunity[] }>('/admin/communities/pending');
  return data.communities;
};

export const approveCommunity = async (chatRoomId: string): Promise<void> => {
  await api.post(`/admin/communities/${chatRoomId}/approve`);
};

export const rejectCommunity = async (chatRoomId: string, reason: string): Promise<void> => {
  await api.post(`/admin/communities/${chatRoomId}/reject`, { reason });
};

// ---- Account freeze/suspend ----

export interface FrozenUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  frozenReason: string | null;
  frozenAt: string | null;
  frozenBy: { username: string } | null;
}

export const fetchFrozenUsers = async (): Promise<FrozenUser[]> => {
  const { data } = await api.get<{ users: FrozenUser[] }>('/admin/users/frozen');
  return data.users;
};

export const freezeUser = async (userId: string, reason: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/freeze`, { reason });
};

export const unfreezeUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/unfreeze`);
};

export const resumeTrade = async (tradeId: string): Promise<void> => {
  await api.post(`/admin/trades/${tradeId}/resume`);
};

// ---- Dashboard ----

export interface DashboardOverview {
  userCount: number;
  tradeCount: number;
  disputedCount: number;
  totalVolume: string | number;
  pendingKycCount: number;
  pendingGroupsCount: number;
  frozenCount: number;
}

export const fetchDashboard = async (): Promise<DashboardOverview> => {
  const { data } = await api.get<DashboardOverview>('/admin/dashboard');
  return data;
};

// ---- KYC ----

export interface KycUser {
  id: string; name: string; username: string; email: string; tempId: string;
  verificationDocumentName: string | null; phoneNumber: string | null;
  bankName: string | null; accountNumber: string | null;
}

export const fetchPendingKyc = async (): Promise<KycUser[]> => {
  const { data } = await api.get<{ users: KycUser[] }>('/admin/kyc/pending');
  return data.users;
};

export const approveKyc = async (userId: string): Promise<void> => {
  await api.post(`/admin/kyc/${userId}/approve`);
};

export const rejectKyc = async (userId: string, reason: string): Promise<void> => {
  await api.post(`/admin/kyc/${userId}/reject`, { reason });
};

// ---- Audit logs ----

export interface AuditLogEntry {
  id: string; action: string; details: string; createdAt: string;
  actor: { username: string } | null;
  targetUser: { username: string } | null;
}

export const fetchAuditLogs = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AuditLogEntry[]; pagination: any }>('/admin/audit-logs', { params: { page, limit } });
  return data;
};


export interface AdminWithdrawal {
  id: string; amount: string | number; status: string; reference: string | null; createdAt: string;
  user: { username: string; name: string; withdrawalBankName: string | null; withdrawalAccountNumber: string | null; withdrawalAccountName: string | null };
}

export const fetchAllWithdrawals = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AdminWithdrawal[]; pagination: any }>('/admin/withdrawals', { params: { page, limit } });
  return data;
};


export interface AdminProduct {
  id: string; title: string; price: string | number; category: string; createdAt: string;
  seller: { username: string };
}

export const fetchAllProducts = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AdminProduct[]; pagination: any }>('/admin/products', { params: { page, limit } });
  return data;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await api.delete(`/admin/products/${productId}`);
};


export interface AdminReview {
  id: string; rating: number; content: string; createdAt: string;
  reviewer: { username: string }; seller: { username: string };
}

export const fetchAllReviews = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AdminReview[]; pagination: any }>('/admin/reviews', { params: { page, limit } });
  return data;
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/admin/reviews/${reviewId}`);
};


export interface AdminOrder {
  id: string; orderRef: string; price: string | number; status: string; createdAt: string;
  buyer: { username: string }; seller: { username: string }; product: { title: string };
}

export const fetchAllOrders = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AdminOrder[]; pagination: any }>('/admin/orders', { params: { page, limit } });
  return data;
};



export interface AdminVendor {
  id: string; username: string; name: string; email: string; isPro: boolean;
  rating: number; totalSales: number; reviewsCount: number; isFrozen: boolean;
  verificationStatus: string; createdAt: string;
}

export const fetchVendors = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AdminVendor[]; pagination: any }>('/admin/vendors', { params: { page, limit } });
  return data;
};


export interface ProductCategory {
  name: string;
  productCount: number;
}

export const fetchCategories = async (): Promise<ProductCategory[]> => {
  const { data } = await api.get<{ categories: ProductCategory[] }>('/admin/categories');
  return data.categories;
};



export interface AdminTransaction {
  id: string;
  type: string;
  provider: string;
  amount: string | number;
  status: string;
  reference: string | null;
  createdAt: string;
  user: { username: string };
}

export const fetchAllTransactions = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: AdminTransaction[]; pagination: any }>('/admin/transactions', { params: { page, limit } });
  return data;
};



export interface SystemHealth {
  failedTransactions: number;
  pendingWithdrawals: number;
  totalTrades: number;
  activeTrades: number;
}

export const fetchSystemHealth = async (): Promise<SystemHealth> => {
  const { data } = await api.get<SystemHealth>('/admin/health');
  return data;
};