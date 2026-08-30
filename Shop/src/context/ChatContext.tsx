import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatRoom, ChatMessage } from '../types/chat';
import { useAuth } from './AuthContext';
import { chatService, ChatRoom as ApiChatRoom } from '../services/chatService';
import { chatSocket } from '../sockets/chat.socket';

interface ChatContextType {
  chatRooms: ChatRoom[];
  sendMessage: (roomId: string, text: string) => void;
  getChatRoom: (roomId: string) => ChatRoom | undefined;
  getChatWithUser: (username: string) => ChatRoom | undefined;
  createChatRoom: (participantUsername: string, participantName: string) => void;
  markAsRead: (roomId: string) => void;
  totalUnread: number;
  startChatWithSeller: (sellerUsername: string, sellerName: string) => void;
  totalUnreadChats: number;
  loading: boolean;
  refreshChats: () => Promise<void>;
  loadFullChatHistory: (roomId: string) => Promise<void>;
  sendError: string | null;
  clearSendError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const mapApiRoomToChatRoom = (apiRoom: any, currentUsername: string): ChatRoom => {
  let participants = apiRoom.participants || [];

  if (participants.length === 0) {
    const initiator = apiRoom.initiator;
    const participant = apiRoom.participant;

    if (initiator && initiator.username !== currentUsername) {
      participants = [{ user: initiator }];
    } else if (participant && participant.username !== currentUsername) {
      participants = [{ user: participant }];
    }
  }

  const otherParticipant = participants.find((p: any) => p.user?.username !== currentUsername);
  const isAI = apiRoom.type === 'DIRECT' && otherParticipant?.user?.username === 'micha_ai';

  let participantRole = 'user';
  if (isAI) {
    participantRole = 'ai';
  } else if (otherParticipant?.user?.role) {
    participantRole = otherParticipant.user.role;
  } else if (otherParticipant?.role) {
    participantRole = otherParticipant.role;
  }

  const unreadCount = apiRoom.messages?.filter((m: any) => !m.isRead && m.sender?.username !== currentUsername).length || 0;

  return {
    id: apiRoom.id,
    participantUsername: otherParticipant?.user?.username || otherParticipant?.username || 'Unknown',
    participantName: otherParticipant?.user?.name || otherParticipant?.name || 'Unknown',
    participantAvatar: (otherParticipant?.user?.name || otherParticipant?.name || '?').charAt(0).toUpperCase(),
    participantRole: participantRole as 'user' | 'seller' | 'ai',
    lastMessage: apiRoom.lastMessage || 'No messages',
    lastMessageTime: apiRoom.lastMessageAt ? new Date(apiRoom.lastMessageAt).toLocaleTimeString() : 'now',
    unreadCount: unreadCount,
    messages: apiRoom.messages?.map((m: any) => ({
      id: m.id,
      chatId: m.chatRoomId,
      senderUsername: m.isSystem ? 'system' : (m.sender?.username || 'Unknown'),
      senderName: m.isSystem ? 'System' : (m.sender?.name || 'Unknown'),
      senderRole: m.isSystem ? 'system' : ((m.sender?.role as 'user' | 'seller' | 'ai') || 'user'),
      content: m.content,
      timestamp: m.createdAt,
      isRead: !!m.isRead,
      sharedTrade: m.sharedTrade
        ? {
            id: m.sharedTrade.id,
            title: m.sharedTrade.title,
            amount: Number(m.sharedTrade.amount),
            image: m.sharedTrade.image ?? null,
            status: m.sharedTrade.status
          }
        : null
    })) || [],
    isPinned: participants.find((p: any) => p.user?.username === currentUsername || p.username === currentUsername)?.isPinned || false,
    isAI: isAI,
    type: apiRoom.type,
    name: apiRoom.name,
    description: apiRoom.description,
    participants: participants,
    activeTrade: apiRoom.associatedTrade
      ? {
          id: apiRoom.associatedTrade.id,
          title: apiRoom.associatedTrade.title,
          amount: Number(apiRoom.associatedTrade.amount),
          status: apiRoom.associatedTrade.status,
          image: apiRoom.associatedTrade.image ?? null
        }
      : null
  };
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState<string | null>(null);

  const loadChats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await chatService.getUserChats();
      console.log('[loadChats] raw response.data.chats:', response.data.chats);
      const mappedRooms = response.data.chats.map((room: any) =>
        mapApiRoomToChatRoom(room, user.username)
      );
      console.log('[loadChats] mapped rooms (messages per room):', mappedRooms.map(r => ({ id: r.id, messages: r.messages })));
      setChatRooms(mappedRooms);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [user]);

  useEffect(() => {
    if (!user) {
      chatSocket.disconnect();
      return;
    }

    const token = localStorage.getItem('shopfair_token');
    if (token) {
      chatSocket.connect(token);
    }

    return () => {
      chatSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (message: any) => {
      console.log('[socket] onNewMessage received:', message);

      setChatRooms(prev => {
        const existing = prev.find(r => r.id === message.chatRoomId);
        console.log('[socket] room before update:', existing?.messages);

        if (!existing) {
          console.log('[socket] room not found in state, calling loadChats()');
          loadChats();
          return prev;
        }

        const newMsg: ChatMessage = {
          id: message.id,
          chatId: message.chatRoomId,
          senderUsername: message.isSystem ? 'system' : message.sender?.username,
          senderName: message.isSystem ? 'System' : message.sender?.name,
          senderRole: message.isSystem ? 'system' : (message.sender?.role as 'user' | 'seller' | 'ai'),
          content: message.content,
          timestamp: message.createdAt,
          isRead: !!message.isRead,
          sharedTrade: message.sharedTrade
            ? {
                id: message.sharedTrade.id,
                title: message.sharedTrade.title,
                amount: Number(message.sharedTrade.amount),
                image: message.sharedTrade.image ?? null,
                status: message.sharedTrade.status
              }
            : null
        };

        const next = prev.map(room => {
          if (room.id === message.chatRoomId) {
            const isMine = message.senderId === user.id;
            const shouldMarkRead = !isMine && selectedRoomId === message.chatRoomId;

            const optimisticMatch = isMine
              ? room.messages.find(
                  (m) => m.id.startsWith('temp_') && m.content === message.content && m.senderUsername === user.username
                )
              : undefined;

            if (optimisticMatch) {
              setPendingMessages((prevPending) => {
                const next = { ...prevPending };
                delete next[optimisticMatch.id];
                return next;
              });
            }

            const withoutOptimisticDuplicate = isMine
              ? room.messages.filter((m) => m.id !== optimisticMatch?.id)
              : room.messages;

            return {
              ...room,
              lastMessage: message.content,
              lastMessageTime: 'now',
              messages: [...withoutOptimisticDuplicate, newMsg],
              unreadCount: shouldMarkRead ? 0 : (isMine ? room.unreadCount : room.unreadCount + 1)
            };
          }
          return room;
        });

        console.log('[socket] room after update:', next.find(r => r.id === message.chatRoomId)?.messages);
        return next;
      });
    };

    const handleMessagesRead = (data: any) => {
      setChatRooms(prev =>
        prev.map(room => {
          if (room.id === data.chatRoomId) {
            const iAmTheReader = data.userId === user.id;
            return {
              ...room,
              unreadCount: iAmTheReader ? 0 : room.unreadCount,
              messages: iAmTheReader
                ? room.messages
                : room.messages.map((m) =>
                    m.senderUsername === user.username ? { ...m, isRead: true } : m
                  )
            };
          }
          return room;
        })
      );
    };

    const handleError = (data: { message: string }) => {
      console.log('[socket] onError:', data);
      setPendingMessages((prevPending) => {
        const pendingIds = Object.keys(prevPending);
        if (pendingIds.length > 0) {
          setChatRooms((prevRooms) =>
            prevRooms.map((room) => ({
              ...room,
              messages: room.messages.filter((m) => !pendingIds.includes(m.id))
            }))
          );
        }
        return {};
      });
      setSendError(data.message);
    };

    chatSocket.on('onNewMessage', handleNewMessage);
    chatSocket.on('onMessagesRead', handleMessagesRead);
    chatSocket.on('onError', handleError);

    return () => {
      chatSocket.off('onNewMessage', handleNewMessage);
      chatSocket.off('onMessagesRead', handleMessagesRead);
      chatSocket.off('onError', handleError);
    };
  }, [user, selectedRoomId]);

  const sendMessage = async (roomId: string, text: string) => {
    if (!user) return;

    const tempId = `temp_${Date.now()}`;
    console.log('[sendMessage] optimistic add, tempId:', tempId, 'text:', text);

    setChatRooms(prev =>
      prev.map((room) => {
        if (room.id === roomId) {
          const newMsg: ChatMessage = {
            id: tempId,
            chatId: roomId,
            senderUsername: user.username,
            senderName: user.name,
            senderRole: user.role === 'seller' ? 'seller' : 'user',
            content: text,
            timestamp: new Date().toISOString(),
            isRead: false
          };
          return {
            ...room,
            lastMessage: text,
            lastMessageTime: 'now',
            messages: [...room.messages, newMsg]
          };
        }
        return room;
      })
    );

    setPendingMessages((prev) => ({ ...prev, [tempId]: roomId }));
    chatSocket.sendMessage(roomId, text);
  };

  const getChatRoom = (roomId: string) => {
    return chatRooms.find((room) => room.id === roomId);
  };

  const getChatWithUser = (username: string) => {
    return chatRooms.find((room) => room.participantUsername === username);
  };

  const createChatRoom = async (participantUsername: string, participantName: string) => {
    if (!user) return;

    const existing = chatRooms.find((c) => c.participantUsername === participantUsername);
    if (existing) return;

    try {
      const response = await chatService.getOrCreateDirectChat(participantUsername);
      const newRoom = mapApiRoomToChatRoom(response.data.chatRoom, user.username);
      setChatRooms([newRoom, ...chatRooms]);
    } catch (error) {
      console.error('Failed to create chat room:', error);
    }
  };

  const markAsRead = (roomId: string) => {
    if (!user) return;

    setChatRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          return { ...room, unreadCount: 0 };
        }
        return room;
      })
    );

    setSelectedRoomId(roomId);
    chatSocket.markAsRead(roomId);
  };

  const loadFullChatHistory = async (roomId: string) => {
    if (!user) return;

    console.log('[loadFullChatHistory] fetching full history for room:', roomId);
    try {
      const response = await chatService.getChatRoom(roomId);
      console.log('[loadFullChatHistory] raw response:', response.data.chatRoom);
      const fullRoom = mapApiRoomToChatRoom(response.data.chatRoom, user.username);
      console.log('[loadFullChatHistory] mapped messages:', fullRoom.messages);

      setChatRooms((prev) =>
        prev.map((room) => (room.id === roomId ? { ...room, messages: fullRoom.messages } : room))
      );
    } catch (error) {
      console.error('Failed to load full chat history:', error);
    }
  };

  const refreshChats = loadChats;

  const totalUnread = chatRooms.reduce((sum, r) => sum + r.unreadCount, 0);

  return (
    <ChatContext.Provider value={{
      chatRooms,
      sendMessage,
      getChatRoom,
      getChatWithUser,
      createChatRoom,
      markAsRead,
      totalUnread,
      startChatWithSeller: createChatRoom,
      totalUnreadChats: totalUnread,
      loading,
      refreshChats,
      loadFullChatHistory,
      sendError,
      clearSendError: () => setSendError(null)
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}