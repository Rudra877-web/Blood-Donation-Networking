import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { notify } from '../services/notificationService';
import { logAction } from '../services/logService';

export const listNotifications = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);
  return ok(res, { items, unreadCount: unread });
});

export const unreadCount = asyncHandler(async (req, res) =>
  ok(res, { unreadCount: await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }) }));

export const markRead = asyncHandler(async (req, res) => {
  const r = await prisma.notification.updateMany({ where: { id: Number(req.params.id), userId: req.user!.id }, data: { isRead: true } });
  if (!r.count) throw new AppError('Notification not found', 404);
  return ok(res, null, 'Marked as read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  return ok(res, null, 'All notifications marked as read');
});

export const send = asyncHandler(async (req, res) => {
  const { title, message, audience, userId, type } = req.body;
  let ids: number[] = [];
  if (audience === 'USER') {
    if (!userId) throw new AppError('userId is required for a single-user notification', 400);
    ids = [userId];
  } else {
    const users = await prisma.user.findMany({ where: { status: 'ACTIVE', role: audience === 'ALL' ? { not: 'ADMIN' } : audience }, select: { id: true } });
    ids = users.map((u) => u.id);
  }
  for (const id of ids) await notify(id, type, title, message);
  await logAction(req.user!.id, 'NOTIFICATION_SEND', { details: `${audience}: ${title} (${ids.length} recipients)`, req });
  return ok(res, { recipients: ids.length }, `Notification sent to ${ids.length} user(s)`);
});
