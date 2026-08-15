import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  discoverCommunities as discoverCommunitiesApi,
  joinCommunity as joinCommunityApi,
  leaveCommunity as leaveCommunityApi,
  createCommunity as createCommunityApi,
  CreateCommunityPayload,
  Community
} from '../services/communityService';

interface CommunityContextType {
  communities: Community[];
  isLoading: boolean;
  error: string | null;
  discover: (search?: string) => Promise<void>;
  join: (chatRoomId: string) => Promise<void>;
  leave: (chatRoomId: string) => Promise<void>;
  create: (payload: CreateCommunityPayload) => Promise<Community>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discover = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await discoverCommunitiesApi(search);
      setCommunities(result);
    } catch (err) {
      setError('Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const join = async (chatRoomId: string) => {
    await joinCommunityApi(chatRoomId);
    setCommunities((prev) => prev.filter((c) => c.id !== chatRoomId));
  };

  const leave = async (chatRoomId: string) => {
    await leaveCommunityApi(chatRoomId);
  };

  const create = async (payload: CreateCommunityPayload) => {
    return createCommunityApi(payload);
  };

  return (
    <CommunityContext.Provider value={{ communities, isLoading, error, discover, join, leave, create }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunities() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunities must be used within a CommunityProvider');
  }
  return context;
}