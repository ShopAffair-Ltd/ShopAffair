import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { EscrowNotification } from '../types/notification';
import { useAuth } from './AuthContext';
import { chatSocket } from '../sockets/chat.socket';
import {
  fetchNotifications,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  deleteNotification as deleteNotificationApi
} from '../services/notificationService';

interface NotificationContextType {
  notifications: EscrowNotification[];
  unreadCount: number;
  loading: boolean;
  // Kept for backward compatibility with any local/optimistic notification
  // some flows may still want to show instantly - it's a client-only entry
  // and is not persisted to the server. Server-driven notifications (funded
  // trades, payments, withdrawals, etc.) arrive via refresh()/polling.
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLL_INTERVAL_MS = 30_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<EscrowNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchNotifications();
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      // Non-fatal: the bell just won't update this cycle. Next poll retries.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;

    // Socket delivers new notifications instantly; polling stays as a light
    // fallback in case the socket drops without the client noticing.
    const interval = setInterval(refresh, POLL_INTERVAL_MS);

    const handleNewNotification = (raw: { id: string; title: string; message: string; type: string; createdAt: string }) => {
      const notif: EscrowNotification = {
        id: raw.id,
        userId: user.username,
        title: raw.title,
        message: raw.message,
        type: raw.type.toLowerCase() as EscrowNotification['type'],
        read: false,
        createdAt: raw.createdAt
      };
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    chatSocket.on('onNewNotification', handleNewNotification);

    return () => {
      clearInterval(interval);
      chatSocket.off('onNewNotification', handleNewNotification);
    };
  }, [user, refresh]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => {
    const newNotif: EscrowNotification = {
      id: `local_${Date.now()}`,
      userId: user?.username ?? 'current_user',
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Local-only entries (from addNotification) have no server counterpart.
    if (!id.startsWith('local_')) {
      markNotificationReadApi(id).catch(() => {
        // If this fails, the next refresh() poll will resync the true state.
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    markAllNotificationsReadApi().catch(() => {});
  };

  const clearAll = () => {
    const serverIds = notifications.filter((n) => !n.id.startsWith('local_')).map((n) => n.id);
    setNotifications([]);
    setUnreadCount(0);
    Promise.all(serverIds.map((id) => deleteNotificationApi(id).catch(() => {})));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, addNotification, markAsRead, markAllAsRead, clearAll, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}