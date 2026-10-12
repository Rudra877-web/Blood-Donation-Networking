import { Response } from 'express';

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const ok = (res: Response, data: unknown = null, message = 'Request successful', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const paginate = (query: any, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit, take: limit };
};
