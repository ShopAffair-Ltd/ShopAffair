import React, { createContext, useContext, useState } from 'react';

type AuthModalMode = 'login' | 'register' | 'verify-wizard';

interface NewAccountDetails {
  accountNumber: string;
  bankName: string;
}

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  openVerifyWizard: () => void;
  close: () => void;
  // Set right after a fresh signup generates a real Paystack deposit
  // account, so AccountCreatedModal (mounted separately, as its own step)
  // knows what to show. Cleared once that modal is dismissed.
  newAccount: NewAccountDetails | null;
  showNewAccount: (details: NewAccountDetails) => void;
  clearNewAccount: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>('login');
  const [newAccount, setNewAccount] = useState<NewAccountDetails | null>(null);

  const openLogin = () => {
    setMode('login');
    setIsOpen(true);
  };

  const openRegister = () => {
    setMode('register');
    setIsOpen(true);
  };

  const openVerifyWizard = () => {
    setMode('verify-wizard');
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const showNewAccount = (details: NewAccountDetails) => setNewAccount(details);
  const clearNewAccount = () => setNewAccount(null);

  return (
    <AuthModalContext.Provider
      value={{ isOpen, mode, openLogin, openRegister, openVerifyWizard, close, newAccount, showNewAccount, clearNewAccount }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}