import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { setupChatSocket } from '../sockets/chat.socket';

interface SocketUserPayload {
  id: string;
  username: string;
  role: string;
}

export let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:3000',  'http://localhost:5174', 'https://shops-lake.vercel.app'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as SocketUserPayload;

      socket.data.user = payload;
      socket.data.userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUserPayload;
    socket.join(`user:${user.id}`);
  });

  
  setupChatSocket(io);

  return io;
};