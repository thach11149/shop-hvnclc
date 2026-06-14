import { Router } from 'express';
import { body } from 'express-validator';
import { QnAService } from './q-and-a.service';
import { authenticate, authorize, optionalAuth } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createQnARouter(qnaService: QnAService) {
  const router = Router();

  router.get('/products/:productId/qna', optionalAuth, async (req, res) => {
    const result = await qnaService.getProductQnA(req.params.productId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      unanswered: req.query.unanswered === 'true',
    });
    sendSuccess(res, result);
  });

  router.post(
    '/products/:productId/qna',
    authenticate,
    [body('question').trim().notEmpty().withMessage('Question is required')],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await qnaService.askQuestion(req.user!.id, req.params.productId, req.body.question);
      sendSuccess(res, result, 'Question submitted', 201);
    }
  );

  router.patch(
    '/qna/:id/answer',
    authenticate,
    authorize('SELLER_OWNER', 'SELLER_STAFF'),
    [body('answer').trim().notEmpty().withMessage('Answer is required')],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await qnaService.answerQuestion(req.user!.id, req.params.id, req.body.answer);
      sendSuccess(res, result, 'Answer submitted');
    }
  );

  router.delete('/qna/:id', authenticate, async (req: AuthRequest, res) => {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN_CONTENT'].includes(req.user!.role);
    const result = await qnaService.deleteQuestion(req.user!.id, req.params.id, isAdmin);
    sendSuccess(res, result);
  });

  router.get(
    '/seller/qna',
    authenticate,
    authorize('SELLER_OWNER', 'SELLER_STAFF'),
    async (req: AuthRequest, res) => {
      const shop = await (qnaService as any).prisma.shop.findFirst({
        where: { sellerProfile: { userId: req.user!.id } },
        select: { id: true },
      });
      if (!shop) return sendSuccess(res, { items: [], total: 0 });

      const result = await qnaService.getSellerQnA(shop.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        answered: req.query.answered === 'true' ? true : req.query.answered === 'false' ? false : undefined,
      });
      sendSuccess(res, result);
    }
  );

  router.get('/admin/qna', authenticate, authorize('SUPER_ADMIN', 'ADMIN_CONTENT'), async (req: AuthRequest, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      (qnaService as any).prisma.productQnA.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, id: true } },
          asker: { select: { buyerProfile: { select: { fullName: true } } } },
        },
      }),
      (qnaService as any).prisma.productQnA.count(),
    ]);

    sendSuccess(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  return router;
}
