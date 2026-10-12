import { Request } from 'express';
import { prisma } from '../config/prisma';

export async function logAction(
  userId: number | null | undefined,
  action: string,
  opts: { entity?: string; entityId?: number; details?: string; req?: Request } = {},
) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details,
        ip: opts.req?.ip,
      },
    });
  } catch (e) {
    console.error('Failed to write system log', e);
  }
}
