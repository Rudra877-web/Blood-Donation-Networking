import rateLimit from 'express-rate-limit';

const handler = (_req: any, res: any) =>
  res.status(429).json({ success: false, message: 'Too many requests, please try again later', data: null });

export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, handler });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, handler });
