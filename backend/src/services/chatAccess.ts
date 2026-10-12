import { prisma } from '../config/prisma';

/** Chat belongs to a blood request. Participants: owning receiver, request's hospital, donors who accepted, admin. */
export async function canAccessChat(user: { id: number; role: string }, requestId: number): Promise<boolean> {
  if (!Number.isInteger(requestId)) return false;
  if (user.role === 'ADMIN') return !!(await prisma.bloodRequest.findUnique({ where: { id: requestId }, select: { id: true } }));
  const req = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    select: { receiver: { select: { userId: true } }, hospital: { select: { userId: true } } },
  });
  if (!req) return false;
  if (user.role === 'RECEIVER') return req.receiver.userId === user.id;
  if (user.role === 'HOSPITAL') return req.hospital?.userId === user.id;
  if (user.role === 'DONOR') {
    const a = await prisma.requestAlert.findFirst({ where: { requestId, status: 'ACCEPTED', donor: { userId: user.id } } });
    return !!a;
  }
  return false;
}

export async function chatParticipantUserIds(requestId: number): Promise<number[]> {
  const req = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    select: {
      receiver: { select: { userId: true } },
      hospital: { select: { userId: true } },
      alerts: { where: { status: 'ACCEPTED' }, select: { donor: { select: { userId: true } } } },
    },
  });
  if (!req) return [];
  return [req.receiver.userId, req.hospital?.userId, ...req.alerts.map((a) => a.donor.userId)].filter((x): x is number => !!x);
}
