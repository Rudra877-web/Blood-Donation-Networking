import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/response';
import { env } from '../config/env';

export const notFound = (req: Request, res: Response) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, data: null });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`).join('; ');
    return res.status(422).json({ success: false, message: msg, data: null });
  }
  if (err instanceof AppError) return res.status(err.status).json({ success: false, message: err.message, data: null });
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'A record with these details already exists', data: null });
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Record not found', data: null });
    if (err.code === 'P2003') return res.status(409).json({ success: false, message: 'Operation blocked by related records', data: null });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: env.nodeEnv === 'production' ? 'Internal server error' : err.message || 'Internal server error',
    data: null,
  });
};
