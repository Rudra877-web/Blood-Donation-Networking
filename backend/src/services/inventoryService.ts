import { BloodGroup } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ALL_BLOOD_GROUPS } from '../utils/bloodCompatibility';

export type EffectiveStatus = 'AVAILABLE' | 'LOW' | 'RESERVED' | 'EXPIRED';

export function effectiveStatus(row: { status: string; units: number; expiryDate: Date }, now = new Date()): EffectiveStatus {
  if (row.expiryDate < now) return 'EXPIRED';
  if (row.status === 'RESERVED') return 'RESERVED';
  if (row.units <= 2) return 'LOW';
  return 'AVAILABLE';
}

/** Per-blood-group totals of usable (non-expired, non-reserved) stock. */
export async function inventorySummary() {
  const now = new Date();
  const rows = await prisma.bloodInventory.findMany();
  return summarise(rows, now);
}

export function summarise(rows: { bloodGroup: BloodGroup; units: number; amountMl: number; status: string; expiryDate: Date }[], now = new Date()) {
  return ALL_BLOOD_GROUPS.map((g) => {
    const mine = rows.filter((r) => r.bloodGroup === g);
    const usable = mine.filter((r) => effectiveStatus(r, now) !== 'EXPIRED' && r.status !== 'RESERVED');
    const units = usable.reduce((s, r) => s + r.units, 0);
    const reserved = mine.filter((r) => r.status === 'RESERVED' && r.expiryDate >= now).reduce((s, r) => s + r.units, 0);
    const expired = mine.filter((r) => r.expiryDate < now).reduce((s, r) => s + r.units, 0);
    return {
      bloodGroup: g,
      units,
      amountMl: usable.reduce((s, r) => s + r.amountMl, 0),
      reservedUnits: reserved,
      expiredUnits: expired,
      status: units <= env.rules.lowStockUnits ? 'LOW' : 'AVAILABLE',
    };
  });
}
