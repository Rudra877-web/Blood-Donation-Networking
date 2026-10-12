import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok, paginate } from '../utils/response';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { userSelect } from '../utils/userMapper';
import { createUserWithProfile } from '../services/userService';
import { logAction } from '../services/logService';
import { notify } from '../services/notificationService';
import { inventorySummary } from '../services/inventoryService';

export const dashboard = asyncHandler(async (_req, res) => {
  const [donors, receivers, hospitals, pending, active, completed, donations, summary, recent, recentRequests] = await Promise.all([
    prisma.user.count({ where: { role: 'DONOR' } }),
    prisma.user.count({ where: { role: 'RECEIVER' } }),
    prisma.user.count({ where: { role: 'HOSPITAL' } }),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.bloodRequest.count({ where: { status: { in: ['PENDING', 'APPROVED', 'MATCHED'] } } }),
    prisma.bloodRequest.count({ where: { status: 'COMPLETED' } }),
    prisma.donation.count(),
    inventorySummary(),
    prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true, role: true } } } }),
    prisma.bloodRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { receiver: { select: { user: { select: { name: true } } } } } }),
  ]);
  return ok(res, {
    totals: { donors, receivers, hospitals, pendingRegistrations: pending, activeRequests: active, completedRequests: completed, totalDonations: donations },
    inventory: summary,
    recentActivities: recent,
    recentRequests,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query);
  const { role, status, search } = req.query as Record<string, string | undefined>;
  const where: Prisma.UserWhereInput = {
    role: role && ['ADMIN', 'DONOR', 'RECEIVER', 'HOSPITAL'].includes(role) ? (role as any) : undefined,
    status: status && ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'].includes(status) ? (status as any) : undefined,
    OR: search
      ? [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { donor: { city: { contains: search, mode: 'insensitive' } } },
          { receiver: { city: { contains: search, mode: 'insensitive' } } },
          { hospital: { city: { contains: search, mode: 'insensitive' } } },
        ]
      : undefined,
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: userSelect }),
    prisma.user.count({ where }),
  ]);
  return ok(res, { items, total, page, limit });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, select: userSelect });
  if (!user) throw new AppError('User not found', 404);
  return ok(res, user);
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await createUserWithProfile(req.body, 'ACTIVE');
  await logAction(req.user!.id, 'USER_CREATE', { entity: 'User', entityId: user.id, details: `Admin created ${user.role} ${user.email}`, req });
  return ok(res, user, 'User created', 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw new AppError('User not found', 404);
  const b = req.body;
  const data: Prisma.UserUpdateInput = { name: b.name, phone: b.phone, email: b.email };
  if (b.password) data.passwordHash = await bcrypt.hash(b.password, 12);
  if (u.role === 'DONOR') data.donor = { update: { bloodGroup: b.bloodGroup, address: b.address, city: b.city, latitude: b.latitude, longitude: b.longitude } };
  if (u.role === 'RECEIVER') data.receiver = { update: { bloodGroup: b.bloodGroup, address: b.address, city: b.city } };
  if (u.role === 'HOSPITAL') data.hospital = { update: { licenseNo: b.licenseNo, address: b.address, city: b.city, latitude: b.latitude, longitude: b.longitude } };
  const user = await prisma.user.update({ where: { id }, data, select: userSelect });
  await logAction(req.user!.id, 'USER_UPDATE', { entity: 'User', entityId: id, req });
  return ok(res, user, 'User updated');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user!.id) throw new AppError('You cannot delete your own account', 400);
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw new AppError('User not found', 404);
  await prisma.user.delete({ where: { id } });
  await logAction(req.user!.id, 'USER_DELETE', { entity: 'User', entityId: id, details: `Deleted ${u.role} ${u.email}`, req });
  return ok(res, null, 'User deleted');
});

async function applyStatus(req: any, id: number, status: 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'PENDING', reason?: string) {
  if (id === req.user.id && status !== 'ACTIVE') throw new AppError('You cannot change your own account status', 400);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);
  const wasPending = user.status === 'PENDING';
  const updated = await prisma.user.update({ where: { id }, data: { status }, select: userSelect });
  const action = wasPending && status === 'ACTIVE' ? 'REGISTRATION_APPROVED' : status === 'REJECTED' ? 'REGISTRATION_REJECTED' : `USER_${status}`;
  await logAction(req.user.id, action, { entity: 'User', entityId: id, details: reason, req });
  if (status === 'ACTIVE' && wasPending) {
    await notify(id, 'REGISTRATION_APPROVED', 'Account approved', 'Your registration has been approved. You can now use the platform.', { email: true });
  } else if (status === 'REJECTED') {
    await notify(id, 'REGISTRATION_REJECTED', 'Registration rejected', `Your registration was rejected.${reason ? ` Reason: ${reason}` : ''}`, { email: true });
  }
  return updated;
}

export const approveUser = asyncHandler(async (req, res) => {
  const { approve, reason } = req.body;
  const user = await applyStatus(req, Number(req.params.id), approve === false ? 'REJECTED' : 'ACTIVE', reason);
  return ok(res, user, approve === false ? 'Registration rejected' : 'Registration approved');
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await applyStatus(req, Number(req.params.id), req.body.status, req.body.reason);
  return ok(res, user, `User status set to ${req.body.status}`);
});

export const listLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query, 25);
  const { action, search } = req.query as Record<string, string | undefined>;
  const where: Prisma.SystemLogWhereInput = {
    action: action || undefined,
    OR: search ? [{ details: { contains: search, mode: 'insensitive' } }, { user: { name: { contains: search, mode: 'insensitive' } } }] : undefined,
  };
  const [items, total] = await Promise.all([
    prisma.systemLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, role: true } } } }),
    prisma.systemLog.count({ where }),
  ]);
  return ok(res, { items, total, page, limit });
});

export const settings = asyncHandler(async (_req, res) =>
  ok(res, {
    minDonationGapDays: env.rules.minDonationGapDays,
    minDonorWeightKg: env.rules.minDonorWeightKg,
    matchBatchSize: env.rules.matchBatchSize,
    radiusStepsKm: env.rules.radiusStepsKm,
    autoExpandAfterMinutes: env.rules.autoExpandAfterMinutes,
    lowStockUnits: env.rules.lowStockUnits,
    emailConfigured: !!env.smtp.host,
  }),
);
