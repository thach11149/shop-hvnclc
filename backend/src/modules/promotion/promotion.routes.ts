import { Router } from 'express';
import { body } from 'express-validator';
import { PromotionService } from './promotion.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import type { AuthRequest } from '../../shared/types';

export function createPromotionRouter(promotionService: PromotionService): Router {
  const router = Router();

  // POST /promotions/validate-coupon — validate voucher without applying it
  router.post('/promotions/validate-coupon',
    [body('code').notEmpty(), body('subtotal').isFloat({ min: 0 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const { code, subtotal, cartItems } = req.body;
        const userId = (req as AuthRequest).user?.id || 'guest';
        const result = await promotionService.validateVoucher(
          code, userId,
          cartItems || [],
          subtotal || 0
        );
        sendSuccess(res, {
          valid: true,
          discount: result.discountAmount,
          type: result.type,
          description: `Giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`,
        });
      } catch (err: any) {
        sendSuccess(res, { valid: false, discount: 0, type: null, description: err.message });
      }
    }
  );

  // GET /promotions — list active promotions for buyers
  router.get('/promotions', async (req, res) => {
    const promos = await promotionService.getActivePromotions();
    sendSuccess(res, promos);
  });

  // Admin routes
  router.post('/admin/promotions', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'),
    [
      body('code').notEmpty(),
      body('discountType').notEmpty(),
      body('discountValue').isFloat({ min: 0 }),
      body('startAt').isISO8601(),
      body('endAt').isISO8601(),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const promo = await promotionService.createPromotion(req.body, req.user!.id);
      sendSuccess(res, promo, 'Promotion created', 201);
    }
  );

  router.patch('/admin/promotions/:id', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const promo = await promotionService.updatePromotion(req.params.id, req.body);
    sendSuccess(res, promo);
  });

  router.delete('/admin/promotions/:id', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    await promotionService.deletePromotion(req.params.id);
    sendSuccess(res, null, 'Promotion deleted');
  });

  return router;
}
