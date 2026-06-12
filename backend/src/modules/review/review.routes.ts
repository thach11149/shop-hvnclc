import { Router } from 'express';
import { body } from 'express-validator';
import { ReviewService } from './review.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createReviewRouter(reviewService: ReviewService) {
  const router = Router();

  router.get('/products/:productId/reviews', async (req, res) => {
    const result = await reviewService.getProductReviews(req.params.productId, {
      rating: req.query.rating ? Number(req.query.rating) : undefined,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.post('/reviews', authenticate, authorize('BUYER'),
    [
      body('productId').notEmpty(),
      body('orderId').notEmpty(),
      body('rating').isInt({ min: 1, max: 5 }),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const review = await reviewService.createReview(req.user!.id, req.body);
      sendSuccess(res, review, 'Review created', 201);
    }
  );

  router.post('/reviews/:id/vote', authenticate, async (req: AuthRequest, res) => {
    const result = await reviewService.voteReview(req.params.id, req.user!.id, req.body.isHelpful);
    sendSuccess(res, result);
  });

  router.patch('/admin/reviews/:id/hide', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const result = await reviewService.hideReview(req.params.id, req.user!.id);
    sendSuccess(res, result);
  });

  return router;
}
