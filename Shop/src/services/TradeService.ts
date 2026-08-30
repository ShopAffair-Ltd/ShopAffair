import { api } from './api';
import { TradeItem, TradeType, TradeCategory, TradeVisibility, EscrowStatus, MarketProduct } from '../types';

const typeToApi: Record<TradeType, string> = {
  [TradeType.SUPPLY]: 'SUPPLY',
  [TradeType.REQUEST]: 'REQUEST'
};
const typeToDisplay: Record<string, TradeType> = {
  SUPPLY: TradeType.SUPPLY,
  REQUEST: TradeType.REQUEST
};

const categoryToApi: Record<TradeCategory, string> = {
  [TradeCategory.PHYSICAL]: 'PHYSICAL',
  [TradeCategory.DIGITAL]: 'DIGITAL',
  [TradeCategory.SERVICE]: 'SERVICE'
};
const categoryToDisplay: Record<string, TradeCategory> = {
  PHYSICAL: TradeCategory.PHYSICAL,
  DIGITAL: TradeCategory.DIGITAL,
  SERVICE: TradeCategory.SERVICE
};

interface RawParticipant {
  id: string;
  username: string;
  name: string;
}

interface RawTrade {
  id: string;
  title: string;
  amount: string | number;
  status: string;
  type: string;
  category: string;
  visibility?: string;
  condition?: string | null;
  specs?: Record<string, unknown> | null;
  accountNumber?: string | null;
  deliveryFee: string | number;
  deliveryTime?: string | null;
  takeOffLocation?: string | null;
  deliveryLocation?: string | null;
  image?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  pickupCode?: string | null;
  pickupAttempts?: number;
  creator: RawParticipant;
  buyer?: RawParticipant | null;
}

const mapToTradeItem = (raw: RawTrade): TradeItem => ({
  id: raw.id,
  title: raw.title,
  creatorUsername: raw.creator.username,
  creatorName: raw.creator.name,
  creatorRating: 4.8, // no rating system on the backend yet
  reviewsCount: 0,
  amount: Number(raw.amount),
  status: raw.status as EscrowStatus,
  type: typeToDisplay[raw.type] ?? TradeType.SUPPLY,
  category: categoryToDisplay[raw.category] ?? TradeCategory.PHYSICAL,
  visibility: (raw.visibility as TradeVisibility) ?? TradeVisibility.MARKET,
  condition: raw.condition ?? undefined,
  specs: raw.specs as Record<string, string> | undefined,
  accountNumber: raw.accountNumber ?? undefined,
  deliveryFee: Number(raw.deliveryFee),
  deliveryTime: raw.deliveryTime ?? undefined,
  takeOffLocation: raw.takeOffLocation ?? undefined,
  deliveryLocation: raw.deliveryLocation ?? undefined,
  image: raw.image ?? undefined,
  description: raw.description ?? undefined,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  pickupCode: raw.pickupCode ?? undefined,
  pickupAttempts: raw.pickupAttempts,
  buyerUsername: raw.buyer?.username
});

export interface ListTradesParams {
  page?: number;
  limit?: number;
  status?: EscrowStatus;
  type?: TradeType;
  category?: TradeCategory;
  search?: string;
  mine?: boolean;
  storeOf?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ListTradesResult {
  items: TradeItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const fetchTrades = async (params: ListTradesParams = {}): Promise<ListTradesResult> => {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.status) query.status = params.status;
  if (params.type) query.type = typeToApi[params.type];
  if (params.category) query.category = categoryToApi[params.category];
  if (params.search) query.search = params.search;
  if (params.mine) query.mine = 'true';
  if (params.storeOf) query.storeOf = params.storeOf;
  if (params.location) query.location = params.location;
  if (params.minPrice !== undefined) query.minPrice = String(params.minPrice);
  if (params.maxPrice !== undefined) query.maxPrice = String(params.maxPrice);

  const { data } = await api.get<{ items: RawTrade[]; pagination: ListTradesResult['pagination'] }>(
    '/trades',
    { params: query }
  );

  return { items: data.items.map(mapToTradeItem), pagination: data.pagination };
};

export const fetchTradeById = async (id: string): Promise<TradeItem> => {
  const { data } = await api.get<{ trade: RawTrade }>(`/trades/${id}`);
  return mapToTradeItem(data.trade);
};

export interface CreateTradePayload {
  title: string;
  amount: number;
  type: TradeType;
  category: TradeCategory;
  visibility?: TradeVisibility;
  condition?: string;
  specs?: Record<string, unknown>;
  accountNumber?: string;
  deliveryFee?: number;
  deliveryTime: string;
  takeOffLocation?: string;
  deliveryLocation?: string;
  image?: string;
  description?: string;
}

export const createTrade = async (payload: CreateTradePayload): Promise<TradeItem> => {
  const { data } = await api.post<{ trade: RawTrade }>('/trades', {
    ...payload,
    type: typeToApi[payload.type],
    category: categoryToApi[payload.category]
  });  

  return mapToTradeItem(data.trade);
};

export type EditTradePayload = Partial<Omit<CreateTradePayload, 'type'>>;

export const editTrade = async (tradeId: string, payload: EditTradePayload): Promise<TradeItem> => {
  const body: Record<string, unknown> = { ...payload };
  if (payload.category) {
    body.category = categoryToApi[payload.category];
  }

  const { data } = await api.patch<{ trade: RawTrade }>(`/trades/${tradeId}`, body);
  return mapToTradeItem(data.trade);
};

export const cancelTrade = async (tradeId: string): Promise<TradeItem> => {
  const { data } = await api.post<{ trade: RawTrade }>(`/trades/${tradeId}/cancel`);
  return mapToTradeItem(data.trade);
};

export const fundTrade = async (tradeId: string): Promise<TradeItem> => {
  const { data } = await api.post<{ trade: RawTrade }>(`/trades/${tradeId}/fund`);
  return mapToTradeItem(data.trade);
};

export const verifyPickupCode = async (tradeId: string, code: string): Promise<TradeItem> => {
  const { data } = await api.post<{ trade: RawTrade }>(`/trades/${tradeId}/verify-pickup`, { code });
  return mapToTradeItem(data.trade);
};

export const updateTradeStatus = async (tradeId: string, status: EscrowStatus): Promise<TradeItem> => {
  const { data } = await api.patch<{ trade: RawTrade }>(`/trades/${tradeId}/status`, { status });
  return mapToTradeItem(data.trade);
};

export const forceCancelTrade = async (tradeId: string): Promise<TradeItem> => {
  const { data } = await api.post<{ trade: RawTrade }>(`/trades/${tradeId}/force-cancel`);
  return mapToTradeItem(data.trade);
};

const mapConditionToMarketLabel = (condition: string | undefined): 'New' | 'Like New' | 'Gently Used' | 'Fair' => {
  const normalized = (condition ?? '').trim().toLowerCase();
  if (normalized === 'new') return 'New';
  if (normalized.includes('like new')) return 'Like New';
  if (normalized.includes('fair') || normalized.includes('poor')) return 'Fair';
  return 'Gently Used';
};

export const mapTradeToMarketProduct = (trade: TradeItem): MarketProduct | null => {
  if (!trade.image) return null;
  if (trade.type !== TradeType.SUPPLY) return null;

  return {
    id: `trade:${trade.id}`,
    title: trade.title,
    price: trade.amount,
    sellerUsername: trade.creatorUsername,
    sellerName: trade.creatorName,
    rating: trade.creatorRating,
    salesCount: 0,
    reviewsCount: trade.reviewsCount,
    image: trade.image,
    category: trade.category,
    condition: mapConditionToMarketLabel(trade.condition),
    location: trade.takeOffLocation,
    specs: trade.specs,
    description: trade.description ?? `Trade listing for ${trade.title}`
  };
};

export const isTradeBasedProductId = (productId: string): boolean => productId.startsWith('trade:');

export const stripTradeIdPrefix = (productId: string): string => productId.replace(/^trade:/, '');