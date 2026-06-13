import { Router } from 'express';
import { body } from 'express-validator';
import { SellerService } from './seller.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createSellerRouter(sellerService: SellerService) {
  const router = Router();

  // Public shop route (no auth needed)
  router.get('/shops/:slug', async (req, res) => {
    const data = await sellerService.getPublicShopBySlug(req.params.slug);
    sendSuccess(res, data);
  });

  router.post('/seller/register', authenticate,
    [
      body('fullName').notEmpty(),
      body('shopName').notEmpty(),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await sellerService.registerSeller(req.user!.id, req.body);
      sendSuccess(res, result, 'Seller registered', 201);
    }
  );

  router.get('/seller/shop', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const shop = await sellerService.getShop(req.user!.shopId!);
    sendSuccess(res, shop);
  });

  router.patch('/seller/shop', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res) => {
    const shop = await sellerService.updateShop(req.user!.shopId!, req.body);
    sendSuccess(res, shop);
  });

  router.get('/seller/profile', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const profile = await sellerService.getSellerProfile(req.user!.id);
    sendSuccess(res, profile);
  });

  // Admin routes
  router.get('/admin/sellers', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const result = await sellerService.getAdminSellers({
      status: req.query.status as Parameters<typeof sellerService.getAdminSellers>[0]['status'],
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.get('/admin/sellers/:id', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const shop = await sellerService.getShop(req.params.id);
    sendSuccess(res, shop);
  });

  router.patch('/admin/sellers/:id/approve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const shop = await sellerService.approveSeller(req.params.id, req.user!.id);
    sendSuccess(res, shop);
  });

  router.patch('/admin/sellers/:id/reject', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'),
    [body('reason').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const shop = await sellerService.rejectSeller(req.params.id, req.user!.id, req.body.reason);
      sendSuccess(res, shop);
    }
  );

  return router;
}
