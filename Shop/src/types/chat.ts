export interface ChatMessage {
  id: string;
  chatId: string;
  senderUsername: string;
  senderName: string;
  senderRole: 'buyer' | 'seller' | 'admin' | 'system' | 'ai' | 'user';
  content: string;
  timestamp: string | number;
  attachmentName?: string;
  isRead?: boolean;
  sharedTrade?: {
    id: string;
    title: string;
    amount: number;
    image: string | null;
    status: string;
  } | null;
}

export interface ChatRoom {
  id: string;
  participantUsername: string;
  participantName: string;
  participantAvatar: string;
  participantRole: 'user' | 'seller' | 'ai' | 'buyer' | 'admin' | 'system';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  isPinned: boolean;
  isAI?: boolean;
  type?: 'DIRECT' | 'GROUP' | 'COMMUNITY' | 'individual' | 'group' | 'community';
  name?: string;
  description?: string;
  participants?: any[];
  rating?: number;
  reviewCount?: number;
  sellerId?: string;
  participantId?: string;
  activeTrade?: {
    id: string;
    title: string;
    amount: number;
    status: string;
    image: string | null;
  } | null;
}