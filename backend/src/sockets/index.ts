import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { canAccessChat } from '../services/chatAccess';

let io: Server | null = null;

export function initSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: env.clientUrl, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, role: true, status: true } });
      if (!user || user.status !== 'ACTIVE') return next(new Error('Account not active'));
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: number; role: any };
    socket.join(`user:${user.id}`);
    socket.on('chat:join', async (requestId: number, ack?: (ok: boolean) => void) => {
      const allowed = await canAccessChat(user, Number(requestId));
      if (allowed) socket.join(`request:${requestId}`);
      ack?.(allowed);
    });
    socket.on('chat:leave', (requestId: number) => socket.leave(`request:${requestId}`));
  });
  return io;
}

export const emitToUser = (userId: number, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};
export const emitToRequest = (requestId: number, event: string, payload: unknown) => {
  io?.to(`request:${requestId}`).emit(event, payload);
};
