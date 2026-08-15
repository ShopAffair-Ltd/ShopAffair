import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TradeItem, EscrowStatus } from '../types/trade';
import { useAuth } from './AuthContext';
import * as tradeService from '../services/TradeService';

interface TradeContextType {
  trades: TradeItem[];
  loading: boolean;
  error: string | null;
  refreshTrades: () => Promise<void>;
  createTrade: (
    newTrade: tradeService.CreateTradePayload
  ) => Promise<TradeItem>;
  fundTrade: (tradeId: string) => Promise<TradeItem>;
  verifyPickupCode: (tradeId: string, code: string) => Promise<TradeItem>;
  updateTradeStatus: (id: string, status: EscrowStatus) => Promise<TradeItem>;
  forceCancelTrade: (tradeId: string) => Promise<TradeItem>;
  getTradeById: (id: string) => TradeItem | undefined;
  getUserTrades: (username: string) => TradeItem[];
  totalTrades: number;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tradeService.fetchTrades({ limit: 50 });
      setTrades(result.items);
    } catch (e) {
      console.error(e);
      setError('Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTrades();
  }, [refreshTrades, user?.username]);

  const createTrade: TradeContextType['createTrade'] = async (newTrade) => {
    const item = await tradeService.createTrade(newTrade);
    setTrades((prev) => [item, ...prev]);
    return item;
  };

  const fundTrade: TradeContextType['fundTrade'] = async (tradeId) => {
    const updated = await tradeService.fundTrade(tradeId);
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? updated : t)));
    return updated;
  };

  const verifyPickupCode: TradeContextType['verifyPickupCode'] = async (tradeId, code) => {
    const updated = await tradeService.verifyPickupCode(tradeId, code);
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? updated : t)));
    return updated;
  };

  const updateTradeStatus: TradeContextType['updateTradeStatus'] = async (id, status) => {
    const updated = await tradeService.updateTradeStatus(id, status);
    setTrades((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  // Admin-only in the UI layer: gate calls to this with requireRole-equivalent
  // checks in the component (backend also enforces this via admin RBAC).
  const forceCancelTrade: TradeContextType['forceCancelTrade'] = async (tradeId) => {
    const updated = await tradeService.forceCancelTrade(tradeId);
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? updated : t)));
    return updated;
  };

  const getTradeById = (id: string) => trades.find((t) => t.id === id);

  const getUserTrades = (username: string) =>
    trades.filter((t) => t.creatorUsername === username || t.buyerUsername === username);

  return (
    <TradeContext.Provider
      value={{
        trades,
        loading,
        error,
        refreshTrades,
        createTrade,
        fundTrade,
        verifyPickupCode,
        updateTradeStatus,
        forceCancelTrade,
        getTradeById,
        getUserTrades,
        totalTrades: trades.length
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
}