export type UserRole = 'buyer' | 'seller' | 'admin';
export type VerificationStatus = 'GUEST' | 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserProfile {
  id: string;
  tempId: string;
  name: string;
  username: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  verificationStatus: 'GUEST' | 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  walletBalance: number;
  promoBalance?: number;
  isPro: boolean;
  avatarColor: string;
  bankName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  profilePicture?: string;
  storeName?: string;
  bio?: string;
  location?: string;
  storeCategory?: string;
  coverImage?: string;
  totalTrades?: number;
  completedTrades?: number;
  completionRate?: string;
  tier?: number;
  deliveryAddress?: string;
  rejectionReason?: string;
  verificationDocumentName?: string;
  verificationSubmittedAt?: string;
  lastSeenAt?: string;
  createdAt?: string;  
  updatedAt?: string;  
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}