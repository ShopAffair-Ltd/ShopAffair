import { api } from './api';
import { MarketProduct } from '../types';

// Backend enum <-> frontend display string
const conditionToDisplay: Record<string, MarketProduct['condition']> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GENTLY_USED: 'Gently Used',
  FAIR: 'Fair'
};

const conditionToApi: Record<MarketProduct['condition'], string> = {
  'New': 'NEW',
  'Like New': 'LIKE_NEW',
  'Gently Used': 'GENTLY_USED',
  'Fair': 'FAIR'
};

interface RawSeller {
  id: string;
  username: string;
  name: string;
}

interface RawProduct {
  id: string;
  title: string;
  price: string | number;
  rating: number;
  salesCount: number;
  reviewsCount: number;
  image: string;
  category: string;
  condition: string;
  location?: string | null;
  specs?: Record<string, unknown> | null;
  description: string;
  seller: RawSeller;
}

const mapToMarketProduct = (raw: RawProduct): MarketProduct => ({
  id: raw.id,
  title: raw.title,
  price: Number(raw.price),
  sellerUsername: raw.seller.username,
  sellerName: raw.seller.name,
  rating: raw.rating,
  salesCount: raw.salesCount,
  reviewsCount: raw.reviewsCount,
  image: raw.image,
  category: raw.category,
  condition: conditionToDisplay[raw.condition] ?? 'New',
  location: raw.location ?? undefined,
  specs: raw.specs as Record<string, string> | undefined,
  description: raw.description
});

export interface ListProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  condition?: MarketProduct['condition'];
  sellerId?: string;
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ListProductsResult {
  items: MarketProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchProducts = async (params: ListProductsParams = {}): Promise<ListProductsResult> => {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.category) query.category = params.category;
  if (params.condition) query.condition = conditionToApi[params.condition];
  if (params.sellerId) query.sellerId = params.sellerId;
  if (params.search) query.search = params.search;
  if (params.location) query.location = params.location;
  if (params.minPrice !== undefined) query.minPrice = String(params.minPrice);
  if (params.maxPrice !== undefined) query.maxPrice = String(params.maxPrice);

  const { data } = await api.get<{ items: RawProduct[]; pagination: ListProductsResult['pagination'] }>(
    '/products',
    { params: query }
  );

  return {
    items: data.items.map(mapToMarketProduct),
    pagination: data.pagination
  };
};

export const fetchProductById = async (id: string): Promise<MarketProduct> => {
  const { data } = await api.get<{ product: RawProduct }>(`/products/${id}`);
  return mapToMarketProduct(data.product);
};

export interface CreateProductPayload {
  title: string;
  price: number;
  image: string;
  category: string;
  condition: MarketProduct['condition'];
  location?: string;
  specs?: Record<string, unknown>;
  description: string;
}

export const createProduct = async (payload: CreateProductPayload): Promise<MarketProduct> => {
  const { data } = await api.post<{ product: RawProduct }>('/products', {
    ...payload,
    condition: conditionToApi[payload.condition]
  });
  return mapToMarketProduct(data.product);
};

export const updateProduct = async (
  id: string,
  payload: Partial<CreateProductPayload>
): Promise<MarketProduct> => {
  const body = {
    ...payload,
    ...(payload.condition ? { condition: conditionToApi[payload.condition] } : {})
  };
  const { data } = await api.patch<{ product: RawProduct }>(`/products/${id}`, body);
  return mapToMarketProduct(data.product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};