import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import { userSelect } from '../utils/userMapper';
import { createUserWithProfile } from '../services/userService';
import { logAction } from '../services/logService';
import { notifyRole } from '../services/notificationService';
import { sendMail } from '../services/emailService';

export const register = asyncHandler(async (req, res) => {
  const user = await createUserWithProfile(req.body, 'PENDING');
  await logAction(user.id, 'REGISTER', { entity: 'User', entityId: user.id, details: `${user.role} registered`, req });
  await notifyRole('ADMIN', 'GENERAL', 'New registration pending', `${user.name} (${user.role}) is waiting for approval.`);
  return ok(res, { id: user.id, status: user.status }, 'Registration submitted. You can log in once an administrator approves your account.', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const found = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email / wrong password to avoid user enumeration.
  const valid = found ? await bcrypt.compare(password, found.passwordHash) : false;
  if (!found || !valid) throw new AppError('Invalid email or password', 401);
  if (found.status === 'PENDING') throw new AppError('Your account is awaiting admin approval', 403);
  if (found.status === 'REJECTED') throw new AppError('Your registration was rejected. Please contact support', 403);
  if (found.status === 'SUSPENDED') throw new AppError('Your account is suspended. Please contact support', 403);

  await prisma.user.update({ where: { id: found.id }, data: { lastLoginAt: new Date() } });
  await logAction(found.id, 'LOGIN', { entity: 'User', entityId: found.id, req });
  const user = await prisma.user.findUnique({ where: { id: found.id }, select: userSelect });
  return ok(res, { token: signToken({ id: found.id, role: found.role }), user }, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  await logAction(req.user!.id, 'LOGOUT', { entity: 'User', entityId: req.user!.id, req });
  return ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect });
  return ok(res, user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    const link = `${env.clientUrl}/reset-password?token=${token}`;
    await sendMail(user.email, 'Reset your password', `Use this link within 1 hour to reset your password:\n${link}`);
  }
  return ok(res, null, 'If that email is registered, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.used || reset.expiresAt < new Date()) throw new AppError('Reset link is invalid or has expired', 400);
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
  ]);
  await logAction(reset.userId, 'PASSWORD_RESET', { entity: 'User', entityId: reset.userId, req });
  return ok(res, null, 'Password updated. You can now log in.');
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) throw new AppError('Current password is incorrect', 400);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) } });
  await logAction(user.id, 'PASSWORD_CHANGE', { entity: 'User', entityId: user.id, req });
  return ok(res, null, 'Password changed');
});
