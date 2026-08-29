import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToStorePlan, StorePlanId } from '../services/paymentService';

interface StoreContextType {
  storeUpgradeOpen: boolean;
  selectedStorePlan: StorePlanId | null;
  activating: boolean;
  activateError: string | null;
  openStoreUpgrade: () => void;
  closeStoreUpgrade: () => void;
  selectPlan: (plan: StorePlanId | null) => void;
  activatePlan: (plan: StorePlanId) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [storeUpgradeOpen, setStoreUpgradeOpen] = useState(false);
  const [selectedStorePlan, setSelectedStorePlan] = useState<StorePlanId | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const openStoreUpgrade = () => setStoreUpgradeOpen(true);
  const closeStoreUpgrade = () => {
    setStoreUpgradeOpen(false);
    setSelectedStorePlan(null);
    setActivateError(null);
  };
  const selectPlan = (plan: StorePlanId | null) => {
    setActivateError(null);
    setSelectedStorePlan(plan);
  };

  const activatePlan = async (plan: StorePlanId): Promise<boolean> => {
    if (!user) return false;

    setActivating(true);
    setActivateError(null);

    try {
      await subscribeToStorePlan(plan);
      updateUser({ ...user, isPro: true });
      setStoreUpgradeOpen(false);
      setSelectedStorePlan(null);
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not activate this plan. Please try again.';
      setActivateError(message);
      return false;
    } finally {
      setActivating(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        storeUpgradeOpen,
        selectedStorePlan,
        activating,
        activateError,
        openStoreUpgrade,
        closeStoreUpgrade,
        selectPlan,
        activatePlan
      }}
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