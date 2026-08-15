import { api } from './api';

export interface ChatRoom {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'COMMUNITY';
  name?: string;
  description?: string;
  avatar?: string;
  creatorId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  isPinned?: boolean;
  unreadCount?: number;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  isPinned: boolean;
  lastReadAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;  // Add this
    avatarColor?: string;
    profilePicture?: string;
  };
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  attachmentName?: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
    role: string;  // Add this
    avatarColor?: string;
    profilePicture?: string;
  };
}

export const chatService = {
  getUserChats: () => api.get<{ chats: ChatRoom[] }>('/chat'),

  getChatRoom: (chatRoomId: string) => api.get<{ chatRoom: ChatRoom }>(`/chat/${chatRoomId}`),

  getOrCreateDirectChat: (userId: string) => api.post<{ chatRoom: ChatRoom }>(`/chat/direct/${userId}`),

  createGroup: (data: { name: string; description?: string; memberIds: string[] }) =>
    api.post<{ chatRoom: ChatRoom }>('/chat/group', data),

  createCommunity: (data: { name: string; description?: string; settings?: any }) =>
    api.post<{ chatRoom: ChatRoom }>('/chat/community', data),

  sendMessage: (chatRoomId: string, data: { content: string; attachmentName?: string }) =>
    api.post<{ message: ChatMessage }>(`/chat/${chatRoomId}/messages`, data),

  markAsRead: (chatRoomId: string) => api.post(`/chat/${chatRoomId}/read`),

  togglePin: (chatRoomId: string) => api.post<{ result: ChatParticipant }>(`/chat/${chatRoomId}/pin`),

  clearChat: (chatRoomId: string) => api.post(`/chat/${chatRoomId}/clear`),

  addParticipant: (chatRoomId: string, userId: string) =>
    api.post(`/chat/${chatRoomId}/participants`, { userId }),

  removeParticipant: (chatRoomId: string, userId: string) =>
    api.delete(`/chat/${chatRoomId}/participants/${userId}`),

  blockUser: (userId: string, reason?: string) =>
    api.post(`/chat/block/${userId}`, { reason }),

  unblockUser: (userId: string) =>
    api.delete(`/chat/block/${userId}`),

  getBlockedUsers: () => api.get<{ blockedUsers: any[] }>('/chat/blocked'),

  createInvite: (chatRoomId: string, data: { maxUses?: number; expiresAt?: string }) =>
    api.post<{ invite: any }>(`/chat/${chatRoomId}/invite`, data),

  useInvite: (code: string) =>
    api.post<{ chatRoom: ChatRoom }>(`/chat/invite/${code}/use`)
};