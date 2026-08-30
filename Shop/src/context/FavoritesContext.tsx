import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toggleFavorite as toggleFavoriteApi, fetchFavoriteIds } from '../services/favoriteService';
import { isTradeBasedProductId, stripTradeIdPrefix } from '../services/TradeService';

interface FavoritesContextType {
  favoriteMarketIds: Set<string>;
  isFavorited: (marketProductId: string) => boolean;
  toggleFavorite: (marketProductId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteMarketIds, setFavoriteMarketIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteMarketIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { productIds, tradeIds } = await fetchFavoriteIds();
      const marketIds = new Set<string>([...productIds, ...tradeIds.map((id) => `trade:${id}`)]);
      setFavoriteMarketIds(marketIds);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorited = (marketProductId: string) => favoriteMarketIds.has(marketProductId);

  const toggleFavorite = async (marketProductId: string) => {
    if (!user) return;

    const wasFavorited = favoriteMarketIds.has(marketProductId);

    setFavoriteMarketIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(marketProductId);
      } else {
        next.add(marketProductId);
      }
      return next;
    });

    try {
      const params = isTradeBasedProductId(marketProductId)
        ? { tradeId: stripTradeIdPrefix(marketProductId) }
        : { productId: marketProductId };

      await toggleFavoriteApi(params);
    } catch {
      setFavoriteMarketIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(marketProductId);
        } else {
          next.delete(marketProductId);
        }
        return next;
      });
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteMarketIds, isFavorited, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
