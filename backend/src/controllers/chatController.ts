import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { canAccessChat, chatParticipantUserIds } from '../services/chatAccess';
import { emitToRequest } from '../sockets';
import { notify } from '../services/notificationService';

export const conversations = asyncHandler(async (req, res) => {
  const u = req.user!;
  const where =
    u.role === 'ADMIN' ? {} :
    u.role === 'RECEIVER' ? { receiver: { userId: u.id } } :
    u.role === 'HOSPITAL' ? { hospital: { userId: u.id } } :
    { alerts: { some: { status: 'ACCEPTED' as const, donor: { userId: u.id } } } };
  const items = await prisma.bloodRequest.findMany({
    where, orderBy: { updatedAt: 'desc' }, take: 50,
    select: { id: true, patientName: true, bloodGroup: true, status: true, messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { message: true, createdAt: true } } },
  });
  return ok(res, items);
});

export const getMessages = asyncHandler(async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!(await canAccessChat(req.user!, requestId))) throw new AppError('You are not a participant of this conversation', 403);
  const items = await prisma.chatMessage.findMany({ where: { requestId }, orderBy: { createdAt: 'asc' }, take: 500, include: { sender: { select: { id: true, name: true, role: true } } } });
  return ok(res, items);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!(await canAccessChat(req.user!, requestId))) throw new AppError('You are not a participant of this conversation', 403);
  const msg = await prisma.chatMessage.create({
    data: { requestId, senderId: req.user!.id, message: req.body.message },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  emitToRequest(requestId, 'chat:message', msg);
  // Notify the other participants (in-app) so they see unread activity even if they are not in the chat room.
  const others = (await chatParticipantUserIds(requestId)).filter((id) => id !== req.user!.id);
  await Promise.all([...new Set(others)].map((id) => notify(id, 'GENERAL', `New message on request #${requestId}`, `${req.user!.name}: ${req.body.message.slice(0, 80)}`, { data: { requestId } })));
  return ok(res, msg, 'Message sent', 201);
});
