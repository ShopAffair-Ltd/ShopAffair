import { api } from './api';
import { EscrowNotification } from '../types/notification';

interface RawNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
}

const toClientNotification = (raw: RawNotification): EscrowNotification => ({
  id: raw.id,
  userId: raw.userId,
  title: raw.title,
  message: raw.message,
  type: raw.type.toLowerCase() as EscrowNotification['type'],
  read: raw.read,
  createdAt: raw.createdAt
});

export interface ListNotificationsResult {
  items: EscrowNotification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const fetchNotifications = async (page = 1, limit = 20): Promise<ListNotificationsResult> => {
  const { data } = await api.get<{
    items: RawNotification[];
    unreadCount: number;
    pagination: ListNotificationsResult['pagination'];
  }>('/notifications', { params: { page, limit } });

  return {
    items: data.items.map(toClientNotification),
    unreadCount: data.unreadCount,
    pagination: data.pagination
  };
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};