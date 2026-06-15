import { Router, Response } from 'express';
import { AffiliateService } from './affiliate.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import type { AuthRequest } from '../../shared/types';

export function createAffiliateRouter(affiliateService: AffiliateService): Router {
  const router = Router();

  // Seller routes
  router.get('/seller/affiliate/stats', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await affiliateService.getMyStats(req.user!.shopId!);
    sendSuccess(res, data);
  });

  // Affiliate partner routes
  router.get('/affiliate/links', authenticate, async (req: AuthRequest, res: Response) => {
    const partner = await affiliateService.getPartnerByUserId(req.user!.id);
    const data = await affiliateService.getAffiliateLinks(partner.id);
    sendSuccess(res, data);
  });

  router.post('/affiliate/links', authenticate, async (req: AuthRequest, res: Response) => {
    const partner = await affiliateService.getPartnerByUserId(req.user!.id);
    const data = await affiliateService.createAffiliateLink(partner.id, req.body);
    sendSuccess(res, data, 'Affiliate link đã được tạo', 201);
  });

  router.get('/affiliate/earnings', authenticate, async (req: AuthRequest, res: Response) => {
    const partner = await affiliateService.getPartnerByUserId(req.user!.id);
    const data = await affiliateService.getAffiliateEarnings(partner.id);
    sendSuccess(res, data);
  });

  // Buyer routes
  router.get('/referral/my', authenticate, async (req: AuthRequest, res: Response) => {
    const data = await affiliateService.getMyReferral(req.user!.id);
    sendSuccess(res, data);
  });

  router.post('/referral/generate', authenticate, async (req: AuthRequest, res: Response) => {
    const data = await affiliateService.generateReferralCode(req.user!.id);
    sendSuccess(res, data, 'Link giới thiệu đã được tạo', 201);
  });

  // Admin routes
  router.get('/admin/affiliate/publishers', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await affiliateService.listAdminPublishers();
    sendSuccess(res, data);
  });

  router.post('/admin/affiliate/publishers/:id/approve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await affiliateService.approvePublisher(req.params.id);
    sendSuccess(res, data);
  });

  router.get('/admin/affiliate/commissions', authenticate, authorize('ADMIN_OPERATOR', 'ADMIN_FINANCE', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await affiliateService.listAdminCommissions();
    sendSuccess(res, data);
  });

  router.get('/admin/affiliate/payouts', authenticate, authorize('ADMIN_OPERATOR', 'ADMIN_FINANCE', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await affiliateService.listPendingPayouts();
    sendSuccess(res, data);
  });

  router.post('/admin/affiliate/payouts/:id/process', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await affiliateService.processPayout(req.params.id);
    sendSuccess(res, data);
  });

  return router;
}
