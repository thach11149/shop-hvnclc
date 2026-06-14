import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

const onlineUsers = new Map<string, Set<string>>();

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded: any = jwt.verify(String(token), process.env.JWT_SECRET!);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${user.id} (${user.role})`);

    socket.join(`user:${user.id}`);
    if (user.shopId) socket.join(`shop:${user.shopId}`);

    if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
    onlineUsers.get(user.id)!.add(socket.id);

    socket.on('join:chat', (threadId: string) => {
      socket.join(`chat:${threadId}`);
    });

    socket.on('leave:chat', (threadId: string) => {
      socket.leave(`chat:${threadId}`);
    });

    socket.on('typing', (data: { threadId: string; isTyping: boolean }) => {
      socket.to(`chat:${data.threadId}`).emit('typing', {
        userId: user.id,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(user.id);
          if (user.shopId) {
            io?.to(`shop:${user.shopId}`).emit('seller:offline', { sellerId: user.id });
          }
        }
      }
      logger.info(`Socket disconnected: ${user.id}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToShop(shopId: string, event: string, data: any) {
  io?.to(`shop:${shopId}`).emit(event, data);
}

export function emitToChat(threadId: string, event: string, data: any) {
  io?.to(`chat:${threadId}`).emit(event, data);
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
