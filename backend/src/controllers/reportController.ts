import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { ALL_BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { inventorySummary } from '../services/inventoryService';

const monthKey = (d: Date) => d.toISOString().slice(0, 7);

export const generate = asyncHandler(async (req, res) => {
  const type = String(req.query.type || 'donations');
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 180 * 86400000);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const range = { gte: from, lte: to };
  let report: any;

  if (type === 'donations') {
    const rows = await prisma.donation.findMany({ where: { donationDate: range }, select: { status: true, units: true, donationDate: true } });
    const byStatus: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    rows.forEach((r) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; byMonth[monthKey(r.donationDate)] = (byMonth[monthKey(r.donationDate)] || 0) + r.units; });
    report = { summary: { totalDonations: rows.length, totalUnits: rows.reduce((s, r) => s + r.units, 0) }, breakdowns: { byStatus, unitsByMonth: byMonth } };
  } else if (type === 'requests') {
    const rows = await prisma.bloodRequest.findMany({ where: { createdAt: range }, select: { status: true, urgency: true, units: true, createdAt: true } });
    const by = (k: 'status' | 'urgency') => rows.reduce((m: Record<string, number>, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {});
    const byMonth: Record<string, number> = {};
    rows.forEach((r) => (byMonth[monthKey(r.createdAt)] = (byMonth[monthKey(r.createdAt)] || 0) + 1));
    const done = rows.filter((r) => r.status === 'COMPLETED').length;
    report = { summary: { totalRequests: rows.length, unitsRequested: rows.reduce((s, r) => s + r.units, 0), fulfilmentRate: rows.length ? Math.round((done / rows.length) * 100) : 0 }, breakdowns: { byStatus: by('status'), byUrgency: by('urgency'), requestsByMonth: byMonth } };
  } else if (type === 'users') {
    const [byRole, byStatus, recent] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.count({ where: { createdAt: range } }),
    ]);
    report = { summary: { newUsersInRange: recent, totalUsers: byRole.reduce((s, r) => s + r._count._all, 0) }, breakdowns: { byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])), byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) } };
  } else if (type === 'inventory') {
    const summary = await inventorySummary();
    report = { summary: { totalUnits: summary.reduce((s, r) => s + r.units, 0), lowGroups: summary.filter((s) => s.status === 'LOW').map((s) => s.bloodGroup) }, table: summary };
  } else if (type === 'demand') {
    const [reqs, donors] = await Promise.all([
      prisma.bloodRequest.groupBy({ by: ['bloodGroup'], where: { createdAt: range }, _sum: { units: true }, _count: { _all: true } }),
      prisma.donor.groupBy({ by: ['bloodGroup'], where: { availability: true, user: { status: 'ACTIVE' } }, _count: { _all: true } }),
    ]);
    const table = ALL_BLOOD_GROUPS.map((g) => ({ bloodGroup: g, requests: reqs.find((r) => r.bloodGroup === g)?._count._all ?? 0, unitsRequested: reqs.find((r) => r.bloodGroup === g)?._sum.units ?? 0, availableDonors: donors.find((r) => r.bloodGroup === g)?._count._all ?? 0 }));
    report = { summary: { mostDemanded: [...table].sort((a, b) => b.unitsRequested - a.unitsRequested)[0]?.bloodGroup ?? null }, table };
  } else if (type === 'hospitals') {
    const hospitals = await prisma.hospital.findMany({ include: { user: { select: { name: true } }, _count: { select: { requests: true, patients: true, donations: true } }, requests: { where: { status: 'COMPLETED', createdAt: range }, select: { id: true } } } });
    const table = hospitals.map((h) => ({ hospital: h.user.name, city: h.city, requests: h._count.requests, completed: h.requests.length, patients: h._count.patients, donations: h._count.donations }));
    report = { summary: { hospitals: table.length, totalRequests: table.reduce((s, r) => s + r.requests, 0) }, table };
  } else throw new AppError('Unknown report type', 400);

  const saved = await prisma.report.create({ data: { type, generatedBy: req.user!.id, summary: report.summary } });
  return ok(res, { type, generatedAt: saved.createdAt, from, to, ...report });
});
