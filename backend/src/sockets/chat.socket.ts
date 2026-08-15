import { Server, Socket } from 'socket.io';
import { prisma } from '../config/db';
import * as chatService from '../modules/chat/chat.service.js';

export const setupChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${userId}`);

    socket.on('join_chat', async (chatRoomId: string) => {
      const participant = await prisma.chatRoomParticipant.findUnique({
        where: {
          chatRoomId_userId: {
            chatRoomId,
            userId
          }
        }
      });

      if (participant) {
        socket.join(`chat:${chatRoomId}`);
        socket.emit('chat_joined', { chatRoomId });
      } else {
        socket.emit('error', { message: 'You are not a participant of this chat' });
      }
    });

    socket.on('leave_chat', (chatRoomId: string) => {
      socket.leave(`chat:${chatRoomId}`);
    });

    socket.on('send_message', async (data: { chatRoomId: string; content: string; attachmentName?: string }) => {
      try {
        const message = await chatService.sendMessage(
          data.chatRoomId,
          userId,
          data.content,
          data.attachmentName
        );

        io.to(`chat:${data.chatRoomId}`).emit('new_message', message);

        const chatRoom = await prisma.chatRoom.findUnique({
          where: { id: data.chatRoomId },
          include: {
            participants: {
              include: { user: true }
            }
          }
        });

        if (chatRoom) {
          chatRoom.participants.forEach((p) => {
            if (p.userId !== userId) {
              io.to(`user:${p.userId}`).emit('new_message_notification', {
                chatRoomId: data.chatRoomId,
                message: data.content,
                senderId: userId
              });
            }
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('mark_read', async (data: { chatRoomId: string }) => {
      try {
        await chatService.markMessagesAsRead(data.chatRoomId, userId);
        io.to(`chat:${data.chatRoomId}`).emit('messages_read', {
          chatRoomId: data.chatRoomId,
          userId
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    socket.on('typing_start', (data: { chatRoomId: string }) => {
      socket.to(`chat:${data.chatRoomId}`).emit('user_typing', {
        chatRoomId: data.chatRoomId,
        userId
      });
    });

    socket.on('typing_stop', (data: { chatRoomId: string }) => {
      socket.to(`chat:${data.chatRoomId}`).emit('user_stopped_typing', {
        chatRoomId: data.chatRoomId,
        userId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};