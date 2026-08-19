import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MarketProduct, TradeType } from '../types';
import {
  fetchProducts,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  CreateProductPayload
} from '../services/productService';
import { fetchTrades, mapTradeToMarketProduct } from '../services/TradeService';
import { getApiErrorMessage } from '../services/authService';
import { useAuth } from './AuthContext';

interface MarketContextType {
  products: MarketProduct[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProduct: (product: Omit<CreateProductPayload, 'sellerId'>) => Promise<MarketProduct>;
  editProduct: (id: string, product: Partial<Omit<CreateProductPayload, 'sellerId'>>) => Promise<MarketProduct>;
  deleteProduct: (id: string) => Promise<void>;
  getProductsBySeller: (sellerUsername: string) => MarketProduct[];
  getProductById: (id: string) => MarketProduct | undefined;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productResult, tradeResult] = await Promise.all([
        fetchProducts({ limit: 50 }),
        fetchTrades({ type: TradeType.SUPPLY, limit: 50 })
      ]);

      const tradesAsProducts = tradeResult.items
        .map(mapTradeToMarketProduct)
        .filter((item): item is MarketProduct => item !== null);

      setProducts([...productResult.items, ...tradesAsProducts]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProduct = async (product: Omit<CreateProductPayload, 'sellerId'>) => {
    if (!user) {
      throw new Error('You must be signed in to list a product');
    }
    const created = await createProductApi(product);
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const editProduct = async (id: string, product: Partial<Omit<CreateProductPayload, 'sellerId'>>) => {
    if (!user) {
      throw new Error('You must be signed in to edit a product');
    }
    const updated = await updateProductApi(id, product);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id: string) => {
    if (!user) {
      throw new Error('You must be signed in to delete a product');
    }
    await deleteProductApi(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getProductsBySeller = (sellerUsername: string) => {
    return products.filter((p) => p.sellerUsername === sellerUsername);
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  return (
    <MarketContext.Provider
      value={{
        products,
        isLoading,
        error,
        refresh,
        addProduct,
        editProduct,
        deleteProduct,
        getProductsBySeller,
        getProductById
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}