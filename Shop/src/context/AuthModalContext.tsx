import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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
  const hasPushedHistoryRef = useRef(false);

  const pushHistoryIfNeeded = useCallback(() => {
    if (!hasPushedHistoryRef.current) {
      window.history.pushState({ authModal: true }, '');
      hasPushedHistoryRef.current = true;
    }
  }, []);

  const openLogin = useCallback(() => {
    setMode('login');
    setIsOpen(true);
    pushHistoryIfNeeded();
  }, [pushHistoryIfNeeded]);

  const openRegister = useCallback(() => {
    setMode('register');
    setIsOpen(true);
    pushHistoryIfNeeded();
  }, [pushHistoryIfNeeded]);

  const openVerifyWizard = useCallback(() => {
    setMode('verify-wizard');
    setIsOpen(true);
    pushHistoryIfNeeded();
  }, [pushHistoryIfNeeded]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (hasPushedHistoryRef.current) {
      hasPushedHistoryRef.current = false;
      window.history.back();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      if (hasPushedHistoryRef.current) {
        hasPushedHistoryRef.current = false;
        setIsOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen]);

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