import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { emitToUser } from '../sockets';
import { sendMail } from './emailService';

export async function notify(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  opts: { data?: Record<string, unknown>; email?: boolean } = {},
) {
  const n = await prisma.notification.create({
    data: { userId, type, title, message, data: (opts.data as any) ?? undefined },
  });
  emitToUser(userId, 'notification:new', n);
  if (opts.email) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (u) void sendMail(u.email, title, message);
  }
  return n;
}

export async function notifyRole(role: 'ADMIN' | 'DONOR' | 'RECEIVER' | 'HOSPITAL', type: NotificationType, title: string, message: string) {
  const users = await prisma.user.findMany({ where: { role, status: 'ACTIVE' }, select: { id: true } });
  await Promise.all(users.map((u) => notify(u.id, type, title, message)));
}
