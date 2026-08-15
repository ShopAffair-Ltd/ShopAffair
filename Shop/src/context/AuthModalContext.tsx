import React, { createContext, useContext, useState } from 'react';

type AuthModalMode = 'login' | 'register' | 'verify-wizard';

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  openVerifyWizard: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>('login');

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

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, openLogin, openRegister, openVerifyWizard, close }}>
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