import { api } from './api';

export interface RawCommunity {
  id: string;
  name: string | null;
  description: string | null;
  avatar: string | null;
  createdAt: string;
  settings: Record<string, unknown> | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  creator: {
    id: string;
    username: string;
    name: string;
    avatarColor: string | null;
    isPro?: boolean;
  };
  _count: {
    participants: number;
    messages: number;
  };
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatarLetter: string;
  memberCount: number;
  lastMessage: string;
  createdAt: string;
  creatorUsername: string;
}

const mapToCommunity = (raw: RawCommunity): Community => {
  const name = raw.name || 'Unnamed Community';
  return {
    id: raw.id,
    name,
    description: raw.description || '',
    avatarLetter: name.charAt(0).toUpperCase(),
    memberCount: raw._count.participants,
    lastMessage: raw.description || 'No recent activity',
    createdAt: raw.createdAt,
    creatorUsername: raw.creator.username
  };
};

export const discoverCommunities = async (search?: string): Promise<Community[]> => {
  const { data } = await api.get<{ communities: RawCommunity[] }>('/chat/communities/discover', {
    params: search ? { search } : {}
  });
  return data.communities.map(mapToCommunity);
};

export const joinCommunity = async (chatRoomId: string): Promise<void> => {
  await api.post(`/chat/${chatRoomId}/join`);
};

export const leaveCommunity = async (chatRoomId: string): Promise<void> => {
  await api.post(`/chat/${chatRoomId}/leave`);
};

export interface CreateCommunityPayload {
  name: string;
  description?: string;
  settings?: {
    visibility?: boolean;
    approveMembers?: boolean;
    whoCanChat?: 'ALL' | 'ADMINS';
    whoCanPostTrades?: 'ALL' | 'ADMINS';
    whoCanViewParticipants?: 'ALL' | 'ADMINS';
  };
}

// Creating a group requires an active Seller Pro subscription (checked
// server-side too - this is just a clean error message client-side). Every
// new group starts pending platform-admin approval and won't be
// discoverable or joinable until then.
export const createCommunity = async (payload: CreateCommunityPayload): Promise<Community> => {
  const { data } = await api.post<{ chatRoom: RawCommunity }>('/chat/community', payload);
  return mapToCommunity(data.chatRoom);
};

export const promoteToAdmin = async (chatRoomId: string, userId: string): Promise<void> => {
  await api.post(`/chat/${chatRoomId}/promote/${userId}`);
};

export const updateGroupSettings = async (
  chatRoomId: string,
  settings: Partial<NonNullable<CreateCommunityPayload['settings']>>
): Promise<void> => {
  await api.patch(`/chat/${chatRoomId}/settings`, settings);
};

export const postTradeToGroup = async (chatRoomId: string, tradeId: string): Promise<void> => {
  await api.post(`/chat/${chatRoomId}/trades`, { tradeId });
};
export interface AdminGroup {
  id: string;
  name: string | null;
  avatar: string | null;
}

export const fetchMyAdminGroups = async (): Promise<AdminGroup[]> => {
  const { data } = await api.get<{ groups: AdminGroup[] }>('/chat/communities/my-admin-groups');
  return data.groups;
};