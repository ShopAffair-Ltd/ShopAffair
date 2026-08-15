import { api } from './api';
import { UserProfile } from '../types';

export interface User extends UserProfile {
  online?: boolean;
}

export interface UsersResponse {
  users: User[];
}

export interface StoreProfileResponse {
  id: string;
  username: string;
  name: string;
  storeName: string;
  bio: string;
  location: string;
  category: string;
  coverImage: string | null;
  isVerified: boolean;
  plan: string;
  avatar: string | null;
  followers: number;
  productCount: number;
  rating: number;
  totalSales: number;
  reviewsCount: number;
  followingByMe: boolean;
}

export interface UpdateStoreProfileInput {
  storeName?: string;
  bio?: string;
  location?: string;
  storeCategory?: string;
  coverImage?: string;
}

export interface UserStatsResponse {
  rating: number;
  reviewsCount: number;
  totalSales: number;
  followers: number;
  productsCount: number;
  joinedDate: string;
  isFollowing: boolean;
  storeName: string;
}

export interface FollowResponse {
  success: boolean;
  following: boolean;
  followersCount: number;
}

export const userService = {
  getAllUsers: () => api.get<UsersResponse>('/users'),
  
  searchUsers: (query: string) => api.get<UsersResponse>(`/users/search?q=${query}`),
  
  getUserByUsername: (username: string) => api.get<{ user: User }>(`/users/username/${username}`),
  
  getStoreProfile: async (username: string) => {
    const { data } = await api.get<{ profile: StoreProfileResponse }>(`/users/${username}`);
    return data.profile;
  },
  
  updateMyStoreProfile: async (input: UpdateStoreProfileInput) => {
    const { data } = await api.patch<{ user: unknown }>('/users/me/store-profile', input);
    return data.user;
  },
  
  getUserStats: (username: string) =>
    api.get<UserStatsResponse>(`/users/${username}/stats`),

  followUser: (username: string) =>
    api.post<FollowResponse>(`/users/${username}/follow`),

  unfollowUser: (username: string) =>
    api.delete<FollowResponse>(`/users/${username}/follow`)
};