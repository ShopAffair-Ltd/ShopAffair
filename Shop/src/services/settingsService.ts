import { api } from './api';

export const fetchSettings = async (): Promise<Record<string, string>> => {
  const { data } = await api.get<{ settings: Record<string, string> }>('/settings');
  return data.settings;
};

export const updateSetting = async (key: string, value: string): Promise<void> => {
  await api.post('/settings', { key, value });
};

export const broadcastAlert = async (message: string): Promise<{ recipientCount: number }> => {
  const { data } = await api.post<{ recipientCount: number }>('/settings/broadcast', { message });
  return data;
};

export interface PromoCode {
  id: string;
  code: string;
  discountPct: number;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export const fetchPromoCodes = async (): Promise<PromoCode[]> => {
  const { data } = await api.get<{ promos: PromoCode[] }>('/settings/promo-codes');
  return data.promos;
};

export const createPromoCode = async (code: string, discountPct: number): Promise<PromoCode> => {
  const { data } = await api.post<{ promo: PromoCode }>('/settings/promo-codes', { code, discountPct });
  return data.promo;
};

export const togglePromoCode = async (promoId: string): Promise<void> => {
  await api.patch(`/settings/promo-codes/${promoId}/toggle`);
};

export const deletePromoCode = async (promoId: string): Promise<void> => {
  await api.delete(`/settings/promo-codes/${promoId}`);
};