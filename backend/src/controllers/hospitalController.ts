import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { userSelect } from '../utils/userMapper';
import { logAction } from '../services/logService';
import { changeRequestStatus } from './requestController';
import { ALL_BLOOD_GROUPS } from '../utils/bloodCompatibility';

/** Active hospitals (id, name, location) - used by receivers when creating a request. */
export const listHospitals = asyncHandler(async (_req, res) => {
  const items = await prisma.hospital.findMany({
    where: { user: { status: 'ACTIVE' } },
    select: { id: true, city: true, address: true, latitude: true, longitude: true, user: { select: { name: true, phone: true } } },
    orderBy: { user: { name: 'asc' } },
  });
  return ok(res, items);
});

export const getMe = asyncHandler(async (req, res) => ok(res, await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect })));

export const updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: b.name, phone: b.phone, hospital: { update: { address: b.address, city: b.city, latitude: b.latitude, longitude: b.longitude } } },
    select: userSelect,
  });
  await logAction(req.user!.id, 'PROFILE_UPDATE', { entity: 'Hospital', entityId: user.hospital?.id, req });
  return ok(res, user, 'Profile updated');
});

async function myHospital(userId: number) {
  const h = await prisma.hospital.findUnique({ where: { userId } });
  if (!h) throw new AppError('Hospital profile not found', 404);
  return h;
}

export const incomingRequests = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const status = req.query.status as string | undefined;
  const items = await prisma.bloodRequest.findMany({
    where: { hospitalId: h.id, status: status ? (status as any) : undefined },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      receiver: { select: { city: true, user: { select: { name: true, phone: true } } } },
      alerts: { select: { status: true } },
      donations: { select: { id: true, status: true } },
    },
  });
  // Critical first, then urgent, then normal
  const rank: Record<string, number> = { CRITICAL: 0, URGENT: 1, NORMAL: 2 };
  items.sort((a, b) => rank[a.urgency] - rank[b.urgency]);
  return ok(res, items);
});

export const approve = asyncHandler(async (req, res) => ok(res, await changeRequestStatus(req.user!, Number(req.params.id), 'APPROVED', req), 'Request approved'));
export const reject = asyncHandler(async (req, res) => ok(res, await changeRequestStatus(req.user!, Number(req.params.id), 'REJECTED', req), 'Request rejected'));
export const complete = asyncHandler(async (req, res) => ok(res, await changeRequestStatus(req.user!, Number(req.params.id), 'COMPLETED', req), 'Request marked as completed'));

export const dashboard = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const [pending, total, completed, patients, donationsCompleted, recent] = await Promise.all([
    prisma.bloodRequest.count({ where: { hospitalId: h.id, hospitalApproved: false, status: 'PENDING' } }),
    prisma.bloodRequest.count({ where: { hospitalId: h.id } }),
    prisma.bloodRequest.count({ where: { hospitalId: h.id, status: 'COMPLETED' } }),
    prisma.patient.count({ where: { hospitalId: h.id } }),
    prisma.donation.count({ where: { hospitalId: h.id, status: 'COMPLETED' } }),
    prisma.bloodRequest.findMany({ where: { hospitalId: h.id }, orderBy: { createdAt: 'desc' }, take: 5, include: { receiver: { select: { user: { select: { name: true } } } } } }),
  ]);
  return ok(res, { stats: { pendingRequests: pending, totalRequests: total, completedRequests: completed, patients, completedDonations: donationsCompleted }, recentRequests: recent });
});

export const reports = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const [total, completed, pending, donations, patients, byGroup] = await Promise.all([
    prisma.bloodRequest.count({ where: { hospitalId: h.id } }),
    prisma.bloodRequest.count({ where: { hospitalId: h.id, status: 'COMPLETED' } }),
    prisma.bloodRequest.count({ where: { hospitalId: h.id, status: { in: ['PENDING', 'APPROVED', 'MATCHED'] } } }),
    prisma.donation.count({ where: { hospitalId: h.id } }),
    prisma.patient.count({ where: { hospitalId: h.id } }),
    prisma.bloodRequest.groupBy({ by: ['bloodGroup'], where: { hospitalId: h.id, status: { notIn: ['CANCELLED', 'REJECTED'] } }, _sum: { units: true }, _count: { _all: true } }),
  ]);
  const requirements = ALL_BLOOD_GROUPS.map((g) => {
    const row = byGroup.find((r) => r.bloodGroup === g);
    return { bloodGroup: g, requests: row?._count._all ?? 0, unitsRequired: row?._sum.units ?? 0 };
  });
  return ok(res, { totals: { totalRequests: total, completedRequests: completed, pendingRequests: pending, donations, patients }, requirements });
});

// ---------- Patients ----------
export const listPatients = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const search = req.query.search as string | undefined;
  return ok(res, await prisma.patient.findMany({ where: { hospitalId: h.id, name: search ? { contains: search, mode: 'insensitive' } : undefined }, orderBy: { createdAt: 'desc' } }));
});
export const getPatient = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const p = await prisma.patient.findFirst({ where: { id: Number(req.params.id), hospitalId: h.id } });
  if (!p) throw new AppError('Patient not found', 404);
  return ok(res, p);
});
export const createPatient = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const p = await prisma.patient.create({ data: { ...req.body, hospitalId: h.id } });
  return ok(res, p, 'Patient added', 201);
});
export const updatePatient = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const id = Number(req.params.id);
  if (!(await prisma.patient.findFirst({ where: { id, hospitalId: h.id } }))) throw new AppError('Patient not found', 404);
  return ok(res, await prisma.patient.update({ where: { id }, data: req.body }), 'Patient updated');
});
export const deletePatient = asyncHandler(async (req, res) => {
  const h = await myHospital(req.user!.id);
  const id = Number(req.params.id);
  if (!(await prisma.patient.findFirst({ where: { id, hospitalId: h.id } }))) throw new AppError('Patient not found', 404);
  await prisma.patient.delete({ where: { id } });
  return ok(res, null, 'Patient deleted');
});
