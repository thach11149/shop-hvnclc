import { Router } from 'express';
import { body } from 'express-validator';
import { CampaignService } from './campaign.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createCampaignRouter(campaignService: CampaignService) {
  const router = Router();

  router.get('/campaigns', async (req, res) => {
    const result = await campaignService.getCampaigns({ page: Number(req.query.page), limit: Number(req.query.limit) });
    sendSuccess(res, result);
  });

  router.get('/campaigns/:slug', async (req, res) => {
    const campaign = await campaignService.getCampaignBySlug(req.params.slug);
    sendSuccess(res, campaign);
  });

  router.get('/flash-sale/active', async (req, res) => {
    const flashSales = await campaignService.getActiveFlashSales();
    sendSuccess(res, flashSales);
  });

  // Seller routes
  router.get('/seller/campaigns', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const campaigns = await campaignService.getSellerCampaigns(req.user!.shopId!);
    sendSuccess(res, campaigns);
  });

  router.post('/seller/campaigns/:id/register', authenticate, authorize('SELLER_OWNER'),
    [body('productIds').isArray({ min: 1 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await campaignService.sellerRegisterCampaign(req.params.id, req.user!.shopId!, req.body.productIds);
      sendSuccess(res, result);
    }
  );

  router.post('/seller/flash-sale-items', authenticate, authorize('SELLER_OWNER'),
    [body('slotId').notEmpty(), body('productId').notEmpty(), body('skuId').notEmpty(), body('flashPrice').isFloat({ min: 0 }), body('quota').isInt({ min: 1 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      const item = await campaignService.registerFlashSaleItem(req.body);
      sendSuccess(res, item, 'Flash sale item registered', 201);
    }
  );

  // Admin routes
  router.post('/admin/campaigns', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'),
    [body('name').notEmpty(), body('slug').notEmpty(), body('startAt').isISO8601(), body('endAt').isISO8601()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const campaign = await campaignService.createCampaign(req.body, req.user!.id);
      sendSuccess(res, campaign, 'Campaign created', 201);
    }
  );

  router.patch('/admin/campaigns/:id', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const campaign = await campaignService.updateCampaign(req.params.id, req.body);
    sendSuccess(res, campaign);
  });

  router.post('/admin/flash-sale-slots', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'),
    [body('campaignId').optional(), body('startAt').isISO8601(), body('endAt').isISO8601()],
    validateRequest,
    async (req, res) => {
      const slot = await campaignService.createFlashSaleSlot(req.body.campaignId, req.body);
      sendSuccess(res, slot, 'Flash sale slot created', 201);
    }
  );

  router.patch('/admin/flash-sale-items/:id/approve', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const item = await campaignService.approveFlashSaleItem(req.params.id, req.user!.id);
    sendSuccess(res, item);
  });

  return router;
}
