import { Router, Response } from 'express';
import { AdsService } from './ads.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import type { AuthRequest } from '../../shared/types';

export function createAdsRouter(adsService: AdsService): Router {
  const router = Router();

  // Seller routes
  router.get('/seller/ads/campaigns', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await adsService.listCampaigns(req.user!.shopId!);
    sendSuccess(res, data);
  });

  router.post('/seller/ads/campaigns', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const data = await adsService.createCampaign(req.user!.shopId!, req.body);
    sendSuccess(res, data, 'Chiến dịch đã được tạo', 201);
  });

  router.post('/seller/ads/campaigns/:id/pause', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const data = await adsService.pauseCampaign(req.params.id, req.user!.shopId!);
    sendSuccess(res, data);
  });

  router.post('/seller/ads/campaigns/:id/resume', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const data = await adsService.resumeCampaign(req.params.id, req.user!.shopId!);
    sendSuccess(res, data);
  });

  router.get('/seller/ads/stats', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await adsService.getStats(req.user!.shopId!, req.query.period as string);
    sendSuccess(res, data);
  });

  // Admin routes
  router.get('/admin/ads/campaigns', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await adsService.listAdminCampaigns();
    sendSuccess(res, data);
  });

  router.post('/admin/ads/campaigns/:id/approve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await adsService.approveCampaign(req.params.id);
    sendSuccess(res, data);
  });

  router.post('/admin/ads/campaigns/:id/reject', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await adsService.rejectCampaign(req.params.id);
    sendSuccess(res, data);
  });

  router.get('/admin/ads/revenue', authenticate, authorize('ADMIN_OPERATOR', 'ADMIN_FINANCE', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await adsService.getAdminRevenue();
    sendSuccess(res, data);
  });

  router.get('/admin/ads/keywords', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await adsService.getKeywords();
    sendSuccess(res, data);
  });

  return router;
}
