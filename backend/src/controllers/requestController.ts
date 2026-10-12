import { Prisma, RequestStatus } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok, paginate } from '../utils/response';
import { prisma } from '../config/prisma';
import { logAction } from '../services/logService';
import { notify } from '../services/notificationService';
import { startMatching, expandSearch, inventoryAlternatives } from '../services/matchingService';
import { checkEligibility } from '../utils/eligibility';
import { bloodLabel } from '../utils/bloodCompatibility';
import { AuthUser } from '../middleware/auth';

const listInclude = {
  receiver: { select: { city: true, user: { select: { name: true } } } },
  hospital: { select: { city: true, user: { select: { name: true } } } },
  _count: { select: { alerts: true } },
} satisfies Prisma.BloodRequestInclude;

const detailInclude = {
  receiver: { select: { city: true, address: true, user: { select: { id: true, name: true, phone: true } } } },
  hospital: { select: { id: true, city: true, address: true, user: { select: { id: true, name: true, phone: true } } } },
  alerts: {
    orderBy: [{ distanceKm: 'asc' }, { createdAt: 'asc' }],
    include: { donor: { select: { id: true, bloodGroup: true, city: true, user: { select: { id: true, name: true, phone: true } } } } },
  },
  donations: { include: { donor: { select: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } },
} satisfies Prisma.BloodRequestInclude;

/** Role-scoped WHERE clause: each role only ever sees its own requests. */
function scopeFor(user: AuthUser): Prisma.BloodRequestWhereInput {
  switch (user.role) {
    case 'ADMIN': return {};
    case 'RECEIVER': return { receiver: { userId: user.id } };
    case 'HOSPITAL': return { hospital: { userId: user.id } };
    case 'DONOR': return { alerts: { some: { donor: { userId: user.id } } } };
    default: return { id: -1 };
  }
}

function sanitizeDetail(r: any, user: AuthUser) {
  const out = { ...r };
  if (user.role === 'DONOR') {
    const mine = r.alerts.filter((a: any) => a.donor.user.id === user.id);
    const accepted = mine.some((a: any) => a.status === 'ACCEPTED');
    out.alerts = mine.map((a: any) => ({ ...a, donor: { ...a.donor, user: { id: a.donor.user.id, name: a.donor.user.name } } }));
    if (!accepted) out.receiver = { ...r.receiver, user: { id: r.receiver.user.id, name: r.receiver.user.name } };
    out.donations = [];
  } else if (user.role === 'RECEIVER') {
    // Donor contact details are shared only once the donor accepted.
    out.alerts = r.alerts.map((a: any) =>
      a.status === 'ACCEPTED' ? a : { ...a, donor: { ...a.donor, user: { id: a.donor.user.id, name: a.donor.user.name } } });
  }
  return out;
}

async function loadForUser(id: number, user: AuthUser) {
  const r = await prisma.bloodRequest.findFirst({ where: { id, ...scopeFor(user) }, include: detailInclude });
  if (!r) throw new AppError('Request not found', 404);
  return r;
}

export const createRequest = asyncHandler(async (req, res) => {
  const b = req.body;
  const receiver = await prisma.receiver.findUnique({ where: { userId: req.user!.id } });
  if (!receiver) throw new AppError('Receiver profile not found', 404);
  let hospitalUserId: number | null = null;
  if (b.hospitalId) {
    const h = await prisma.hospital.findFirst({ where: { id: b.hospitalId, user: { status: 'ACTIVE' } } });
    if (!h) throw new AppError('Selected hospital is not available', 400);
    hospitalUserId = h.userId;
  }
  const created = await prisma.bloodRequest.create({
    data: {
      receiverId: receiver.id, hospitalId: b.hospitalId, patientName: b.patientName, bloodGroup: b.bloodGroup, units: b.units,
      urgency: b.urgency, requiredDate: b.requiredDate, city: b.city, address: b.address, latitude: b.latitude, longitude: b.longitude, notes: b.notes,
    },
  });
  await logAction(req.user!.id, 'REQUEST_CREATE', { entity: 'BloodRequest', entityId: created.id, req });
  if (hospitalUserId) {
    await notify(hospitalUserId, 'GENERAL', 'New blood request', `${b.urgency} request for ${b.units} unit(s) of ${bloodLabel(b.bloodGroup)} (patient ${b.patientName}) needs your review.`, { data: { requestId: created.id } });
  }
  const matching = await startMatching(created.id);
  const request = await prisma.bloodRequest.findUnique({ where: { id: created.id } });
  const alternatives = await inventoryAlternatives(created);
  return ok(res, { request, donorsNotified: matching.notified, inventoryAlternatives: alternatives }, 'Blood request created', 201);
});

export const listRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query);
  const q = req.query as Record<string, string | undefined>;
  const where: Prisma.BloodRequestWhereInput = {
    AND: [scopeFor(req.user!)],
    bloodGroup: q.bloodGroup ? (q.bloodGroup as any) : undefined,
    urgency: q.urgency ? (q.urgency as any) : undefined,
    status: q.status ? (q.status as any) : undefined,
    patientName: q.search ? { contains: q.search, mode: 'insensitive' } : undefined,
  };
  const [rows, total] = await Promise.all([
    prisma.bloodRequest.findMany({ where, skip, take, include: listInclude, orderBy: [{ createdAt: 'desc' }] }),
    prisma.bloodRequest.count({ where }),
  ]);
  let items: any[] = rows;
  if (req.user!.role === 'DONOR') {
    const alerts = await prisma.requestAlert.findMany({ where: { donor: { userId: req.user!.id }, requestId: { in: rows.map((r) => r.id) } } });
    items = rows.map((r) => ({ ...r, myAlert: alerts.find((a) => a.requestId === r.id) ?? null }));
  }
  return ok(res, { items, total, page, limit });
});

export const getRequest = asyncHandler(async (req, res) => {
  const r = await loadForUser(Number(req.params.id), req.user!);
  const body: any = sanitizeDetail(r, req.user!);
  if (req.user!.role !== 'DONOR') body.inventoryAlternatives = await inventoryAlternatives(r);
  return ok(res, body);
});

export const updateRequest = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const r = await loadForUser(id, req.user!);
  if (!['ADMIN', 'RECEIVER'].includes(req.user!.role)) throw new AppError('Not allowed', 403);
  if (req.user!.role === 'RECEIVER' && r.status !== 'PENDING') throw new AppError('Only pending requests can be edited', 400);
  const b = req.body;
  const updated = await prisma.bloodRequest.update({
    where: { id },
    data: {
      patientName: b.patientName, units: b.units, urgency: b.urgency, requiredDate: b.requiredDate, city: b.city,
      address: b.address, latitude: b.latitude, longitude: b.longitude, notes: b.notes,
    },
  });
  await logAction(req.user!.id, 'REQUEST_UPDATE', { entity: 'BloodRequest', entityId: id, req });
  return ok(res, updated, 'Request updated');
});

const CLOSED: RequestStatus[] = ['COMPLETED', 'CANCELLED', 'REJECTED'];

/** Single place that enforces who may move a request to which status, plus side effects. */
export async function changeRequestStatus(user: AuthUser, id: number, status: RequestStatus, req?: any) {
  const r = await loadForUser(id, user);
  if (user.role === 'DONOR') throw new AppError('Not allowed', 403);
  if (user.role === 'RECEIVER' && status !== 'CANCELLED') throw new AppError('Receivers can only cancel their own requests', 403);
  if (user.role === 'HOSPITAL' && !['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) throw new AppError('Hospitals can approve, reject or complete requests', 403);
  if (user.role !== 'ADMIN' && CLOSED.includes(r.status)) throw new AppError(`Request is already ${r.status.toLowerCase()}`, 400);
  if (status === 'COMPLETED' && user.role !== 'ADMIN' && !r.hospitalApproved) throw new AppError('Approve the request before completing it', 400);

  const data: Prisma.BloodRequestUpdateInput = { status };
  if (status === 'APPROVED') {
    data.hospitalApproved = true;
    data.approvedAt = new Date();
    data.status = r.status === 'MATCHED' ? 'MATCHED' : 'APPROVED';
  }
  if (status === 'COMPLETED') data.completedAt = new Date();
  const updated = await prisma.bloodRequest.update({ where: { id }, data });
  await logAction(user.id, 'REQUEST_UPDATE', { entity: 'BloodRequest', entityId: id, details: `Status -> ${status}`, req });

  const label = `${bloodLabel(r.bloodGroup)} request for ${r.patientName}`;
  const receiverUser = r.receiver.user.id;
  if (status === 'APPROVED') await notify(receiverUser, 'HOSPITAL_APPROVED', 'Hospital approved your request', `Your ${label} was approved by the hospital.`, { data: { requestId: id }, email: true });
  if (status === 'REJECTED') await notify(receiverUser, 'GENERAL', 'Request rejected', `Your ${label} was rejected.`, { data: { requestId: id }, email: true });
  if (status === 'COMPLETED') {
    const targets = new Set<number>([receiverUser, ...r.alerts.filter((a) => a.status === 'ACCEPTED').map((a) => a.donor.user.id)]);
    for (const uid of targets) await notify(uid, 'REQUEST_COMPLETED', 'Request completed', `The ${label} has been completed. Thank you!`, { data: { requestId: id }, email: uid === receiverUser });
  }
  if (status === 'CANCELLED' && r.hospital) await notify(r.hospital.user.id, 'GENERAL', 'Request cancelled', `The ${label} was cancelled by the receiver.`, { data: { requestId: id } });
  return updated;
}

export const updateStatus = asyncHandler(async (req, res) => {
  const updated = await changeRequestStatus(req.user!, Number(req.params.id), req.body.status, req);
  return ok(res, updated, `Request status updated to ${updated.status}`);
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.bloodRequest.delete({ where: { id } });
  await logAction(req.user!.id, 'REQUEST_DELETE', { entity: 'BloodRequest', entityId: id, req });
  return ok(res, null, 'Request deleted');
});

export const expandRequest = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const r = await loadForUser(id, req.user!);
  if (!['ADMIN', 'RECEIVER'].includes(req.user!.role)) throw new AppError('Not allowed', 403);
  if (CLOSED.includes(r.status)) throw new AppError('Request is closed', 400);
  const result = await expandSearch(id);
  const msg = result.notified ? `Search widened to ${result.radiusKm} km; ${result.notified} more donor(s) notified` : result.maxed ? `Maximum radius (${result.radiusKm} km) reached; no further donors found` : `Search widened to ${result.radiusKm} km; no new eligible donors found`;
  return ok(res, result, msg);
});

export const respond = asyncHandler(async (req, res) => {
  const requestId = Number(req.params.id);
  const donor = await prisma.donor.findUnique({ where: { userId: req.user!.id }, include: { user: { select: { name: true } } } });
  if (!donor) throw new AppError('Donor profile not found', 404);
  const alert = await prisma.requestAlert.findUnique({ where: { requestId_donorId: { requestId, donorId: donor.id } } });
  if (!alert) throw new AppError('You have not been alerted for this request', 403);
  if (alert.status !== 'NOTIFIED') throw new AppError(`You already ${alert.status.toLowerCase()} this request`, 400);
  const r = await prisma.bloodRequest.findUnique({ where: { id: requestId }, include: { receiver: { select: { userId: true } }, hospital: { select: { userId: true } } } });
  if (!r) throw new AppError('Request not found', 404);
  if (CLOSED.includes(r.status)) throw new AppError(`Request is already ${r.status.toLowerCase()}`, 400);

  if (req.body.action === 'REJECT') {
    await prisma.requestAlert.update({ where: { id: alert.id }, data: { status: 'REJECTED' } });
    await logAction(req.user!.id, 'DONOR_REJECT', { entity: 'BloodRequest', entityId: requestId, req });
    // If nobody is left to respond and nobody accepted, widen the search automatically.
    const [waiting, accepted] = await Promise.all([
      prisma.requestAlert.count({ where: { requestId, status: 'NOTIFIED' } }),
      prisma.requestAlert.count({ where: { requestId, status: 'ACCEPTED' } }),
    ]);
    if (waiting === 0 && accepted === 0) await expandSearch(requestId);
    return ok(res, null, 'Request declined');
  }

  const elig = checkEligibility(donor);
  if (!elig.eligible) throw new AppError(`You are currently not eligible to donate. ${elig.reasons.join('. ')}`, 400);
  if (!donor.availability) throw new AppError('Switch your availability ON to accept requests', 400);
  const acceptedCount = await prisma.requestAlert.count({ where: { requestId, status: 'ACCEPTED' } });
  if (acceptedCount >= r.units) throw new AppError('Enough donors have already accepted this request', 400);

  await prisma.$transaction([
    prisma.requestAlert.update({ where: { id: alert.id }, data: { status: 'ACCEPTED' } }),
    prisma.donation.create({ data: { donorId: donor.id, requestId, hospitalId: r.hospitalId, units: 1, status: 'PENDING' } }),
    prisma.bloodRequest.update({ where: { id: requestId }, data: { status: ['PENDING', 'APPROVED'].includes(r.status) ? 'MATCHED' : r.status } }),
  ]);
  await logAction(req.user!.id, 'DONOR_ACCEPT', { entity: 'BloodRequest', entityId: requestId, req });
  const msg = `${donor.user.name} accepted the ${bloodLabel(r.bloodGroup)} request for ${r.patientName}.`;
  await notify(r.receiver.userId, 'DONOR_ACCEPTED', 'A donor accepted your request', msg, { data: { requestId }, email: true });
  if (r.hospital) await notify(r.hospital.userId, 'DONOR_ACCEPTED', 'Donor accepted a request', msg, { data: { requestId } });
  return ok(res, null, 'Thank you! Request accepted. The receiver and hospital have been notified.');
});
