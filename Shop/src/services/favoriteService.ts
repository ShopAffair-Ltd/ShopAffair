import { api } from './api';

export const toggleFavorite = async (params: { productId?: string; tradeId?: string }): Promise<{ favorited: boolean }> => {
  const { data } = await api.post<{ favorited: boolean }>('/favorites/toggle', params);
  return data;
};

export const fetchFavoriteIds = async (): Promise<{ productIds: string[]; tradeIds: string[] }> => {
  const { data } = await api.get<{ productIds: string[]; tradeIds: string[] }>('/favorites/ids');
  return data;
};
