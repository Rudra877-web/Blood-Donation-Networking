import { Prisma } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { userSelect } from '../utils/userMapper';
import { compatibleDonorGroups } from '../utils/bloodCompatibility';
import { haversineKm, round1 } from '../utils/haversine';
import { checkEligibility } from '../utils/eligibility';
import { logAction } from '../services/logService';

export const listDonors = asyncHandler(async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const where: Prisma.DonorWhereInput = {
    bloodGroup: q.bloodGroup ? (q.bloodGroup as any) : undefined,
    city: q.city ? { contains: q.city, mode: 'insensitive' } : undefined,
    user: { status: 'ACTIVE' },
  };
  const donors = await prisma.donor.findMany({ where, include: { user: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  return ok(res, donors.map((d) => ({ ...d, eligibility: checkEligibility(d) })));
});

/** Receiver-facing donor search. Contact details are only revealed for donors who accepted one of the receiver's requests. */
export const searchDonors = asyncHandler(async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  if (!q.bloodGroup) throw new AppError('bloodGroup is required', 400);
  const groups = compatibleDonorGroups(q.bloodGroup as any);
  if (!groups) throw new AppError('Invalid blood group', 400);
  const lat = q.lat ? Number(q.lat) : null;
  const lng = q.lng ? Number(q.lng) : null;
  const radius = q.radius ? Number(q.radius) : null;

  const donors = await prisma.donor.findMany({
    where: {
      bloodGroup: { in: groups },
      user: { status: 'ACTIVE' },
      city: q.city && lat == null ? { contains: q.city, mode: 'insensitive' } : undefined,
    },
    include: { user: { select: { name: true, phone: true } } },
    take: 300,
  });

  let revealIds = new Set<number>();
  if (req.user!.role === 'RECEIVER') {
    const accepted = await prisma.requestAlert.findMany({ where: { status: 'ACCEPTED', request: { receiver: { userId: req.user!.id } } }, select: { donorId: true } });
    revealIds = new Set(accepted.map((a) => a.donorId));
  }
  const canSeeAll = req.user!.role !== 'RECEIVER';

  const results = donors
    .map((d) => {
      const e = checkEligibility(d);
      const distanceKm = lat != null && lng != null && d.latitude != null && d.longitude != null ? round1(haversineKm(lat, lng, d.latitude, d.longitude)) : null;
      return {
        id: d.id, name: d.user.name, bloodGroup: d.bloodGroup, exactMatch: d.bloodGroup === q.bloodGroup, city: d.city, distanceKm,
        availability: d.availability, eligible: e.eligible, nextEligibleDate: e.nextEligibleDate,
        phone: canSeeAll || revealIds.has(d.id) ? d.user.phone : null,
      };
    })
    .filter((d) => d.availability && d.eligible && (radius == null || d.distanceKm == null || d.distanceKm <= radius))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || Number(b.exactMatch) - Number(a.exactMatch));
  return ok(res, results);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect });
  const eligibility = user?.donor ? checkEligibility(user.donor) : null;
  return ok(res, { ...user, eligibility });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: b.name, phone: b.phone,
      donor: { update: { bloodGroup: b.bloodGroup, address: b.address, city: b.city, latitude: b.latitude, longitude: b.longitude, weightKg: b.weightKg, medicalInfo: b.medicalInfo, lastDonationDate: b.lastDonationDate } },
    },
    select: userSelect,
  });
  await logAction(req.user!.id, 'PROFILE_UPDATE', { entity: 'Donor', entityId: user.donor?.id, req });
  return ok(res, { ...user, eligibility: user.donor ? checkEligibility(user.donor) : null }, 'Profile updated');
});

export const setAvailability = asyncHandler(async (req, res) => {
  const donor = await prisma.donor.update({ where: { userId: req.user!.id }, data: { availability: req.body.availability } });
  return ok(res, { availability: donor.availability }, donor.availability ? 'You are now AVAILABLE to receive matching requests' : 'You are now UNAVAILABLE and will not receive requests');
});

export const dashboard = asyncHandler(async (req, res) => {
  const donor = await prisma.donor.findUnique({ where: { userId: req.user!.id } });
  if (!donor) throw new AppError('Donor profile not found', 404);
  const [alertCount, pending, accepted, completed, recent] = await Promise.all([
    prisma.requestAlert.count({ where: { donorId: donor.id } }),
    prisma.requestAlert.count({ where: { donorId: donor.id, status: 'NOTIFIED', request: { status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] } } } }),
    prisma.requestAlert.count({ where: { donorId: donor.id, status: 'ACCEPTED' } }),
    prisma.donation.count({ where: { donorId: donor.id, status: 'COMPLETED' } }),
    prisma.requestAlert.findMany({
      where: { donorId: donor.id, status: 'NOTIFIED', request: { status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] } } },
      orderBy: { createdAt: 'desc' }, take: 5,
      include: { request: { select: { id: true, bloodGroup: true, units: true, urgency: true, city: true, requiredDate: true, hospital: { select: { user: { select: { name: true } } } } } } },
    }),
  ]);
  return ok(res, {
    availability: donor.availability, bloodGroup: donor.bloodGroup, eligibility: checkEligibility(donor), lastDonationDate: donor.lastDonationDate,
    stats: { myRequests: alertCount, pendingAlerts: pending, acceptedRequests: accepted, completedDonations: completed },
    pendingAlerts: recent,
  });
});
