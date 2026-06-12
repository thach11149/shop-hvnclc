import { Router } from 'express';
import { body } from 'express-validator';
import { LoyaltyService } from './loyalty.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createLoyaltyRouter(loyaltyService: LoyaltyService) {
  const router = Router();

  // Buyer routes
  router.get('/loyalty/account', authenticate, async (req: AuthRequest, res) => {
    const account = await loyaltyService.getAccount(req.user!.id);
    sendSuccess(res, account);
  });

  router.get('/loyalty/transactions', authenticate, async (req: AuthRequest, res) => {
    const result = await loyaltyService.getTransactions(req.user!.id, {
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.post('/loyalty/redeem', authenticate,
    [body('points').isInt({ min: 1 }), body('referenceId').optional()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await loyaltyService.redeemPoints(req.user!.id, req.body);
      sendSuccess(res, result);
    }
  );

  // Public routes
  router.get('/loyalty/tiers', async (_req, res) => {
    const tiers = await loyaltyService.getTiers();
    sendSuccess(res, tiers);
  });

  // Admin routes
  router.post('/admin/loyalty/tiers', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    [body('name').notEmpty(), body('minPoints').isInt({ min: 0 }), body('discountRate').isFloat({ min: 0 })],
    validateRequest,
    async (req, res) => {
      const tier = await loyaltyService.createTier(req.body);
      sendSuccess(res, tier, 'Tier created', 201);
    }
  );

  router.post('/admin/loyalty/adjust', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    [body('userId').notEmpty(), body('points').isInt(), body('reason').notEmpty()],
    validateRequest,
    async (req, res) => {
      const result = await loyaltyService.adminAdjustPoints(req.body.userId, req.body.points, req.body.reason);
      sendSuccess(res, result);
    }
  );

  router.post('/internal/loyalty/earn', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    [body('userId').notEmpty(), body('points').isInt({ min: 1 }), body('type').notEmpty()],
    validateRequest,
    async (req, res) => {
      const result = await loyaltyService.earnPoints(req.body.userId, req.body);
      sendSuccess(res, result);
    }
  );

  return router;
}
