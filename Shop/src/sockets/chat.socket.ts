import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../services/chatService';

interface ChatSocketEvents {
  onNewMessage: (message: ChatMessage) => void;
  onMessagesRead: (data: { chatRoomId: string; userId: string }) => void;
  onUserTyping: (data: { chatRoomId: string; userId: string }) => void;
  onUserStoppedTyping: (data: { chatRoomId: string; userId: string }) => void;
  onChatJoined: (data: { chatRoomId: string }) => void;
  onError: (data: { message: string }) => void;
  onNewMessageNotification: (data: { chatRoomId: string; message: string; senderId: string }) => void;
  // Not chat-specific, but delivered over this same socket connection since
  // the app only maintains one authenticated socket per session.
  onNewNotification: (data: { id: string; title: string; message: string; type: string; createdAt: string }) => void;
}

class ChatSocket {
  private socket: Socket | null = null;
  private listeners: Partial<Record<keyof ChatSocketEvents, ((data: any) => void)[]>> = {};

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('new_message', (data: ChatMessage) => {
      this.emit('onNewMessage', data);
    });

    this.socket.on('messages_read', (data: { chatRoomId: string; userId: string }) => {
      this.emit('onMessagesRead', data);
    });

    this.socket.on('user_typing', (data: { chatRoomId: string; userId: string }) => {
      this.emit('onUserTyping', data);
    });

    this.socket.on('user_stopped_typing', (data: { chatRoomId: string; userId: string }) => {
      this.emit('onUserStoppedTyping', data);
    });

    this.socket.on('chat_joined', (data: { chatRoomId: string }) => {
      this.emit('onChatJoined', data);
    });

    this.socket.on('error', (data: { message: string }) => {
      this.emit('onError', data);
    });

    this.socket.on('new_message_notification', (data: { chatRoomId: string; message: string; senderId: string }) => {
      this.emit('onNewMessageNotification', data);
    });

    this.socket.on('new_notification', (data: any) => {
      this.emit('onNewNotification', data);
    });
  }

  joinChat(chatRoomId: string) {
    if (!this.socket) return;
    this.socket.emit('join_chat', chatRoomId);
  }

  leaveChat(chatRoomId: string) {
    if (!this.socket) return;
    this.socket.emit('leave_chat', chatRoomId);
  }

  sendMessage(chatRoomId: string, content: string, attachmentName?: string) {
    if (!this.socket) return;
    this.socket.emit('send_message', { chatRoomId, content, attachmentName });
  }

  markAsRead(chatRoomId: string) {
    if (!this.socket) return;
    this.socket.emit('mark_read', { chatRoomId });
  }

  startTyping(chatRoomId: string) {
    if (!this.socket) return;
    this.socket.emit('typing_start', { chatRoomId });
  }

  stopTyping(chatRoomId: string) {
    if (!this.socket) return;
    this.socket.emit('typing_stop', { chatRoomId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof ChatSocketEvents>(event: K, callback: ChatSocketEvents[K]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  off<K extends keyof ChatSocketEvents>(event: K, callback: ChatSocketEvents[K]) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(cb => cb !== callback);
  }

  private emit<K extends keyof ChatSocketEvents>(event: K, data: Parameters<ChatSocketEvents[K]>[0]) {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach(callback => {
      callback(data);
    });
  }
}

export const chatSocket = new ChatSocket();