import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import { prisma } from '../config/prisma';
import { logAction } from '../services/logService';

export const listFeedback = asyncHandler(async (req, res) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const items = await prisma.feedback.findMany({
    where: isAdmin ? {} : { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, role: true } } },
    take: 200,
  });
  let stats = null;
  if (isAdmin) {
    const [agg, groups] = await Promise.all([
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.feedback.groupBy({ by: ['rating'], _count: { _all: true } }),
    ]);
    stats = {
      average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      total: agg._count._all,
      distribution: [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: groups.find((g) => g.rating === r)?._count._all ?? 0 })),
    };
  }
  return ok(res, { items, stats });
});

export const createFeedback = asyncHandler(async (req, res) => {
  const f = await prisma.feedback.create({ data: { userId: req.user!.id, rating: req.body.rating, comment: req.body.comment, requestId: req.body.requestId } });
  return ok(res, f, 'Thank you for your feedback', 201);
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  await prisma.feedback.delete({ where: { id: Number(req.params.id) } });
  await logAction(req.user!.id, 'FEEDBACK_DELETE', { entity: 'Feedback', entityId: Number(req.params.id), req });
  return ok(res, null, 'Feedback deleted');
});
