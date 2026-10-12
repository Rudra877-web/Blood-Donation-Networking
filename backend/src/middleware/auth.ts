import { NextFunction, Request, Response } from 'express';
import { AccountStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/response';

export interface AuthUser {
  id: number;
  role: Role;
  status: AccountStatus;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifies the JWT and re-checks the account in the database (so suspensions apply immediately). */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw new AppError('Authentication required', 401);
    let payload;
    try {
      payload = verifyToken(header.slice(7));
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, status: true, name: true },
    });
    if (!user) throw new AppError('Account no longer exists', 401);
    if (user.status !== 'ACTIVE') throw new AppError(`Account is ${user.status.toLowerCase()}`, 403);
    // The role is always taken from the database, never from the client.
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to access this resource', 403));
    next();
  };
