import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/user';
import { getCurrentUser, logoutUser as logoutUserService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateUser: (updated: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const profile = await getCurrentUser();
        if (!cancelled) {
          setUser(profile);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = (profile: UserProfile) => {
    setUser(profile);
  };

  const logout = () => {
    logoutUserService();
    setUser(null);
  };

  const updateUser = (updated: UserProfile) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}