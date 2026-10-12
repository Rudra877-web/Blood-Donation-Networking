import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { effectiveStatus, summarise } from '../services/inventoryService';
import { logAction } from '../services/logService';

const include = { hospital: { select: { user: { select: { name: true } } } } };

export const listInventory = asyncHandler(async (req, res) => {
  const bg = req.query.bloodGroup as string | undefined;
  const rows = await prisma.bloodInventory.findMany({ where: { bloodGroup: bg ? (bg as any) : undefined }, include, orderBy: [{ bloodGroup: 'asc' }, { expiryDate: 'asc' }] });
  const items = rows.map((r) => ({ ...r, effectiveStatus: effectiveStatus(r) }));
  return ok(res, { items, summary: summarise(rows) });
});

export const createInventory = asyncHandler(async (req, res) => {
  const b = req.body;
  const row = await prisma.bloodInventory.create({ data: { ...b, amountMl: b.amountMl ?? b.units * 450 } });
  await logAction(req.user!.id, 'INVENTORY_CREATE', { entity: 'BloodInventory', entityId: row.id, details: `${b.units} unit(s) ${b.bloodGroup}`, req });
  return ok(res, row, 'Inventory added', 201);
});

export const updateInventory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body;
  const row = await prisma.bloodInventory.update({ where: { id }, data: { ...b, amountMl: b.amountMl ?? b.units * 450 } });
  await logAction(req.user!.id, 'INVENTORY_UPDATE', { entity: 'BloodInventory', entityId: id, req });
  return ok(res, row, 'Inventory updated');
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.bloodInventory.delete({ where: { id } });
  await logAction(req.user!.id, 'INVENTORY_DELETE', { entity: 'BloodInventory', entityId: id, req });
  return ok(res, null, 'Inventory record deleted');
});

// ----- Public (no login) -----
export const publicAvailability = asyncHandler(async (_req, res) => {
  const rows = await prisma.bloodInventory.findMany();
  return ok(res, summarise(rows).map(({ bloodGroup, units, status }) => ({ bloodGroup, units, status })));
});

export const publicStats = asyncHandler(async (_req, res) => {
  const [donors, hospitals, completed, donations] = await Promise.all([
    prisma.user.count({ where: { role: 'DONOR', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'HOSPITAL', status: 'ACTIVE' } }),
    prisma.bloodRequest.count({ where: { status: 'COMPLETED' } }),
    prisma.donation.count({ where: { status: 'COMPLETED' } }),
  ]);
  return ok(res, { donors, hospitals, completedRequests: completed, donations });
});
