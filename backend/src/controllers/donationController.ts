import { Prisma } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok, paginate } from '../utils/response';
import { prisma } from '../config/prisma';
import { logAction } from '../services/logService';
import { notify } from '../services/notificationService';

const include = {
  donor: { select: { bloodGroup: true, user: { select: { name: true } } } },
  hospital: { select: { user: { select: { name: true } } } },
  request: { select: { id: true, patientName: true, bloodGroup: true } },
} satisfies Prisma.DonationInclude;

function scope(user: { id: number; role: string }): Prisma.DonationWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'DONOR') return { donor: { userId: user.id } };
  if (user.role === 'HOSPITAL') return { hospital: { userId: user.id } };
  if (user.role === 'RECEIVER') return { request: { receiver: { userId: user.id } } };
  return { id: -1 };
}

export const listDonations = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query);
  const status = req.query.status as string | undefined;
  const where: Prisma.DonationWhereInput = { AND: [scope(req.user!)], status: status ? (status as any) : undefined };
  const [items, total] = await Promise.all([
    prisma.donation.findMany({ where, include, skip, take, orderBy: { donationDate: 'desc' } }),
    prisma.donation.count({ where }),
  ]);
  return ok(res, { items, total, page, limit });
});

export const createDonation = asyncHandler(async (req, res) => {
  const b = req.body;
  const d = await prisma.donation.create({ data: { donorId: b.donorId, requestId: b.requestId, hospitalId: b.hospitalId, units: b.units, status: b.status, donationDate: b.donationDate ?? new Date(), notes: b.notes }, include });
  if (d.status === 'COMPLETED') await markCompleted(d.id);
  await logAction(req.user!.id, 'DONATION_CREATE', { entity: 'Donation', entityId: d.id, req });
  return ok(res, d, 'Donation record added', 201);
});

async function markCompleted(id: number) {
  const d = await prisma.donation.findUnique({ where: { id }, include: { donor: { select: { userId: true } } } });
  if (!d) return;
  await prisma.donor.update({ where: { id: d.donorId }, data: { lastDonationDate: d.donationDate } });
  await notify(d.donor.userId, 'GENERAL', 'Donation completed', 'Thank you for donating blood! Your next eligible date has been updated.');
}

export const updateStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.donation.findFirst({ where: { id, ...scope(req.user!) } });
  if (!existing) throw new AppError('Donation not found', 404);
  const d = await prisma.donation.update({ where: { id }, data: { status: req.body.status }, include });
  if (req.body.status === 'COMPLETED' && existing.status !== 'COMPLETED') await markCompleted(id);
  await logAction(req.user!.id, 'DONATION_UPDATE', { entity: 'Donation', entityId: id, details: `Status -> ${req.body.status}`, req });
  return ok(res, d, 'Donation status updated');
});

export const deleteDonation = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.donation.delete({ where: { id } });
  await logAction(req.user!.id, 'DONATION_DELETE', { entity: 'Donation', entityId: id, req });
  return ok(res, null, 'Donation record deleted');
});
