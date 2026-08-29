export enum TradeType {
  SUPPLY = 'Supply',
  REQUEST = 'Request'
}

export enum TradeCategory {
  PHYSICAL = 'Physical Product',
  DIGITAL = 'Digital Asset',
  SERVICE = 'Service Offering'
}

export enum TradeVisibility {
  PRIVATE = 'PRIVATE',
  STORE = 'STORE',
  MARKET = 'MARKET'
}

export enum EscrowStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED'
}

export interface TradeItem {
  id: string;
  title: string;
  creatorUsername: string;
  creatorName: string;
  creatorRating: number;
  reviewsCount: number;
  amount: number;
  status: EscrowStatus;
  type: TradeType;
  category: TradeCategory;
  visibility: TradeVisibility;
  condition?: string;
  specs?: Record<string, string>;
  accountNumber?: string;
  deliveryFee: number;
  deliveryTime?: string;
  takeOffLocation?: string;
  deliveryLocation?: string;
  image?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  pickupCode?: string;
  pickupAttempts?: number;
  buyerUsername?: string;
}