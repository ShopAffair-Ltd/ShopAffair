import { api } from './api';

export interface StoreFollower {
  id: string;
  username: string;
  name: string;
  avatarColor: string | null;
  profilePicture: string | null;
  followedAt: string;
  isBlocked: boolean;
}

export const followUser = async (userId: string): Promise<void> => {
  await api.post(`/follow/${userId}`);
};

export const unfollowUser = async (userId: string): Promise<void> => {
  await api.delete(`/follow/${userId}`);
};

export const checkIsFollowing = async (userId: string): Promise<boolean> => {
  const { data } = await api.get<{ following: boolean }>(`/follow/${userId}/is-following`);
  return data.following;
};

export const fetchFollowCounts = async (userId: string): Promise<{ followers: number; following: number }> => {
  const { data } = await api.get<{ followers: number; following: number }>(`/follow/${userId}/counts`);
  return data;
};

export const fetchMyFollowers = async (): Promise<StoreFollower[]> => {
  const { data } = await api.get<{ followers: StoreFollower[] }>('/follow/me/followers');
  return data.followers;
};
