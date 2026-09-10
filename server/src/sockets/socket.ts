import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { JwtPayload } from '../middlewares/auth.middleware.js';
import { Notification } from '@devconnect/shared';

let io: SocketIOServer | null = null;

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header
    .split(';')
    .map((v) => v.split('='))
    .reduce((acc, [k, v]) => {
      if (k && v) {
        acc[decodeURIComponent(k.trim())] = decodeURIComponent(v.trim());
      }
      return acc;
    }, {} as Record<string, string>);
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const socketOrigins = Array.from(
    new Set([
      ...ENV.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, '')),
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ])
  );

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: socketOrigins,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      let token: string | undefined;

      // Check auth handshake payload
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      } 
      // Check cookies from handshake headers
      else if (socket.handshake.headers.cookie) {
        const parsedCookies = parseCookieHeader(socket.handshake.headers.cookie);
        token = parsedCookies.token;
      }

      if (token) {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
        (socket as any).userId = decoded.userId;
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }

    socket.on('join_user_room', (authUserId: string) => {
      if (authUserId) {
        socket.join(`user_${authUserId}`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function sendRealTimeNotification(userId: string, notification: Notification) {
  if (io) {
    io.to(`user_${userId}`).emit('notification:new', { notification });
  }
}
