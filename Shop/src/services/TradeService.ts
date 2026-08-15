import { api } from './api';
import { TradeItem, TradeType, TradeCategory, EscrowStatus } from '../types';

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
  mine?: boolean;
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
  if (params.mine) query.mine = 'true';

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