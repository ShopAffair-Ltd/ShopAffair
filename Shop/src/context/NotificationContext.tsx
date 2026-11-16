import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
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
  const [activeToasts, setActiveToasts] = useState<EscrowNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const enqueueToast = useCallback((notif: EscrowNotification) => {
    setActiveToasts((prev) => {
      if (prev.some((t) => t.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 3);
    });
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      seenIdsRef.current.clear();
      initialLoadDoneRef.current = false;
      return;
    }
    setLoading(true);
    try {
      const result = await fetchNotifications();
      if (initialLoadDoneRef.current) {
        result.items.forEach((item) => {
          if (!seenIdsRef.current.has(item.id) && !item.read) {
            enqueueToast(item);
          }
        });
      }
      result.items.forEach((item) => seenIdsRef.current.add(item.id));
      initialLoadDoneRef.current = true;
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      // Non-fatal: the bell just won't update this cycle. Next poll retries.
    } finally {
      setLoading(false);
    }
  }, [user, enqueueToast]);

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
      seenIdsRef.current.add(notif.id);
      setNotifications((prev) => (prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]));
      setUnreadCount((prev) => prev + 1);
      enqueueToast(notif);
    };

    chatSocket.on('onNewNotification', handleNewNotification);

    return () => {
      clearInterval(interval);
      chatSocket.off('onNewNotification', handleNewNotification);
    };
  }, [user, refresh, enqueueToast]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => {
    const newNotif: EscrowNotification = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user?.username ?? 'current_user',
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    seenIdsRef.current.add(newNotif.id);
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
    enqueueToast(newNotif);
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
      {activeToasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 space-y-2 pointer-events-none">
          {activeToasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isWarning = toast.type === 'warning' || toast.type === 'alert';
            return (
              <div
                key={toast.id}
                className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-2xl p-3.5 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-600'
                      : isWarning
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-purple-50 text-purple-600'
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : toast.title.toLowerCase().includes('follow') ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-sans font-bold text-slate-900 truncate">{toast.title}</p>
                  <p className="text-[11px] font-sans text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                    {toast.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
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