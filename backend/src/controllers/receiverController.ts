import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { userSelect } from '../utils/userMapper';
import { logAction } from '../services/logService';

export const listReceivers = asyncHandler(async (_req, res) => {
  const items = await prisma.receiver.findMany({ include: { user: { select: { name: true, email: true, phone: true, status: true } } }, orderBy: { createdAt: 'desc' }, take: 300 });
  return ok(res, items);
});

export const getMe = asyncHandler(async (req, res) => ok(res, await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect })));

export const updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: b.name, phone: b.phone, receiver: { update: { address: b.address, city: b.city, bloodGroup: b.bloodGroup } } },
    select: userSelect,
  });
  await logAction(req.user!.id, 'PROFILE_UPDATE', { entity: 'Receiver', entityId: user.receiver?.id, req });
  return ok(res, user, 'Profile updated');
});

export const dashboard = asyncHandler(async (req, res) => {
  const receiver = await prisma.receiver.findUnique({ where: { userId: req.user!.id } });
  if (!receiver) throw new AppError('Receiver profile not found', 404);
  const own = { receiverId: receiver.id };
  const [active, matched, completed, total, byStatus, recent] = await Promise.all([
    prisma.bloodRequest.count({ where: { ...own, status: { in: ['PENDING', 'APPROVED', 'MATCHED'] } } }),
    prisma.requestAlert.count({ where: { status: 'ACCEPTED', request: own } }),
    prisma.bloodRequest.count({ where: { ...own, status: 'COMPLETED' } }),
    prisma.bloodRequest.count({ where: own }),
    prisma.bloodRequest.groupBy({ by: ['status'], where: own, _count: { _all: true } }),
    prisma.bloodRequest.findMany({ where: own, orderBy: { createdAt: 'desc' }, take: 5, include: { hospital: { select: { user: { select: { name: true } } } }, _count: { select: { alerts: true } } } }),
  ]);
  return ok(res, {
    stats: { activeRequests: active, matchedDonors: matched, completedRequests: completed, totalRequests: total },
    statusBreakdown: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    recentRequests: recent,
  });
});
