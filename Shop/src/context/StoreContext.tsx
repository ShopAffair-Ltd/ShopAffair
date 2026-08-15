import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

interface StoreContextType {
  storeUpgradeOpen: boolean;
  selectedStorePlan: 'free' | 'pro' | null;
  openStoreUpgrade: () => void;
  closeStoreUpgrade: () => void;
  selectPlan: (plan: 'free' | 'pro' | null) => void;
  activatePlan: (plan: 'free' | 'pro') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// NOTE: no real subscription/billing backend exists yet. activatePlan only
// flips the local isPro flag via AuthContext.updateUser — no payment is
// actually charged. Replace with a real API call once a subscriptions
// module exists.
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [storeUpgradeOpen, setStoreUpgradeOpen] = useState(false);
  const [selectedStorePlan, setSelectedStorePlan] = useState<'free' | 'pro' | null>(null);

  const openStoreUpgrade = () => setStoreUpgradeOpen(true);
  const closeStoreUpgrade = () => {
    setStoreUpgradeOpen(false);
    setSelectedStorePlan(null);
  };
  const selectPlan = (plan: 'free' | 'pro' | null) => setSelectedStorePlan(plan);

  const activatePlan = (plan: 'free' | 'pro') => {
    if (!user) return;
    updateUser({ ...user, isPro: plan === 'pro' });
    setStoreUpgradeOpen(false);
    setSelectedStorePlan(null);
  };

  return (
    <StoreContext.Provider
      value={{ storeUpgradeOpen, selectedStorePlan, openStoreUpgrade, closeStoreUpgrade, selectPlan, activatePlan }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}