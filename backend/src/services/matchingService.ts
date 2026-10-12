import { BloodRequest } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { compatibleDonorGroups, bloodLabel } from '../utils/bloodCompatibility';
import { haversineKm, round1 } from '../utils/haversine';
import { checkEligibility } from '../utils/eligibility';
import { notify } from './notificationService';
import { effectiveStatus } from './inventoryService';

/** Resolves the coordinates a request should be matched against (hospital first, then request location). */
async function requestCoords(req: BloodRequest) {
  if (req.hospitalId) {
    const h = await prisma.hospital.findUnique({ where: { id: req.hospitalId } });
    if (h?.latitude != null && h?.longitude != null) return { lat: h.latitude, lng: h.longitude, city: h.city };
    if (h) return { lat: req.latitude, lng: req.longitude, city: h.city };
  }
  return { lat: req.latitude, lng: req.longitude, city: req.city };
}

/**
 * Finds eligible donors for a request within `radiusKm`, nearest first, and alerts a batch of them.
 * Steps: compatible groups -> active + available donors -> eligibility -> Haversine distance -> sort -> notify.
 */
export async function runMatchingWave(requestId: number, radiusKm: number, wave: number) {
  const req = await prisma.bloodRequest.findUnique({ where: { id: requestId } });
  if (!req) return { notified: 0 };

  const coords = await requestCoords(req);
  const already = await prisma.requestAlert.findMany({ where: { requestId }, select: { donorId: true } });
  const alreadyIds = already.map((a) => a.donorId);

  const donors = await prisma.donor.findMany({
    where: {
      bloodGroup: { in: compatibleDonorGroups(req.bloodGroup) },
      availability: true,
      user: { status: 'ACTIVE' },
      id: { notIn: alreadyIds },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const candidates = donors
    .filter((d) => checkEligibility(d).eligible)
    .map((d) => {
      let distance: number | null = null;
      if (coords.lat != null && coords.lng != null && d.latitude != null && d.longitude != null) {
        distance = round1(haversineKm(coords.lat, coords.lng, d.latitude, d.longitude));
      }
      return { d, distance };
    })
    .filter(({ d, distance }) =>
      distance != null ? distance <= radiusKm : d.city.trim().toLowerCase() === coords.city.trim().toLowerCase(),
    )
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    .slice(0, env.rules.matchBatchSize);

  for (const { d, distance } of candidates) {
    await prisma.requestAlert.create({ data: { requestId, donorId: d.id, distanceKm: distance, wave } });
    await notify(
      d.user.id,
      'BLOOD_REQUEST_ALERT',
      `${req.urgency} blood request: ${bloodLabel(req.bloodGroup)}`,
      `${req.units} unit(s) of ${bloodLabel(req.bloodGroup)} needed in ${req.city}${distance != null ? ` (${distance} km from you)` : ''}. Open your dashboard to respond.`,
      { data: { requestId }, email: true },
    );
  }
  return { notified: candidates.length };
}

export async function startMatching(requestId: number) {
  const radius = env.rules.radiusStepsKm[0] ?? 10;
  await prisma.bloodRequest.update({ where: { id: requestId }, data: { searchRadiusKm: radius, lastExpandedAt: new Date() } });
  return runMatchingWave(requestId, radius, 1);
}

/** Widens the search radius to the next configured step and alerts the next nearest donors. */
export async function expandSearch(requestId: number) {
  const req = await prisma.bloodRequest.findUnique({ where: { id: requestId } });
  if (!req) return { notified: 0, radiusKm: 0, maxed: false };
  const steps = env.rules.radiusStepsKm;
  const next = steps.find((s) => s > req.searchRadiusKm);
  if (!next) return { notified: 0, radiusKm: req.searchRadiusKm, maxed: true };
  const wave = steps.indexOf(next) + 1;
  await prisma.bloodRequest.update({ where: { id: requestId }, data: { searchRadiusKm: next, lastExpandedAt: new Date() } });
  const r = await runMatchingWave(requestId, next, wave);
  return { ...r, radiusKm: next, maxed: next === steps[steps.length - 1] };
}

/** Background job: expands the search for open requests nobody has accepted yet. */
export function startAutoExpandJob() {
  const everyMs = 60 * 1000;
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - env.rules.autoExpandAfterMinutes * 60 * 1000);
      const open = await prisma.bloodRequest.findMany({
        where: {
          status: { in: ['PENDING', 'APPROVED'] },
          lastExpandedAt: { lt: cutoff },
          alerts: { none: { status: 'ACCEPTED' } },
        },
        select: { id: true },
      });
      for (const r of open) await expandSearch(r.id);
    } catch (e) {
      console.error('Auto-expand job failed', e);
    }
  }, everyMs).unref();
}

/** Blood-bank stock that could serve a request (any compatible group, not expired/reserved). */
export async function inventoryAlternatives(req: Pick<BloodRequest, 'bloodGroup' | 'units'>) {
  const groups = compatibleDonorGroups(req.bloodGroup);
  const rows = await prisma.bloodInventory.findMany({
    where: { bloodGroup: { in: groups }, expiryDate: { gte: new Date() }, status: 'AVAILABLE', units: { gt: 0 } },
    include: { hospital: { select: { user: { select: { name: true } }, city: true } } },
    orderBy: { expiryDate: 'asc' },
  });
  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  return {
    sufficient: totalUnits >= req.units,
    totalUnits,
    items: rows.slice(0, 10).map((r) => ({
      id: r.id,
      bloodGroup: r.bloodGroup,
      units: r.units,
      expiryDate: r.expiryDate,
      status: effectiveStatus(r),
      source: r.hospital ? `${r.hospital.user.name}, ${r.hospital.city}` : 'Central blood bank',
    })),
  };
}
