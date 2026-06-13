import { Router, Response } from 'express';
import { DisputeService } from './dispute.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import type { AuthRequest } from '../../shared/types';

export function createDisputeRouter(disputeService: DisputeService): Router {
  const router = Router();

  // Buyer routes
  router.post('/orders/:orderId/disputes', authenticate, async (req: AuthRequest, res: Response) => {
    const data = await disputeService.createDispute(req.params.orderId, req.user!.id, req.body);
    sendSuccess(res, data, 'Tranh chấp đã được tạo', 201);
  });

  router.get('/account/disputes', authenticate, async (req: AuthRequest, res: Response) => {
    const data = await disputeService.listByBuyer(req.user!.id);
    sendSuccess(res, data);
  });

  router.get('/disputes/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const data = await disputeService.getById(req.params.id);
    sendSuccess(res, data);
  });

  router.post('/disputes/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
    const data = await disputeService.buyerMessage(req.params.id, req.user!.id, req.body.content);
    sendSuccess(res, data, 'Tin nhắn đã được gửi', 201);
  });

  // Seller routes
  router.get('/seller/disputes', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await disputeService.listByShop(req.user!.shopId!);
    sendSuccess(res, data);
  });

  router.post('/seller/disputes/:id/respond', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const data = await disputeService.sellerRespond(req.params.id, req.user!.shopId!, req.body.response);
    sendSuccess(res, data);
  });

  // Admin routes
  router.get('/admin/disputes', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await disputeService.listAdmin(req.query.status as string);
    sendSuccess(res, data);
  });

  router.post('/admin/disputes/:id/resolve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const { resolution, favor } = req.body;
    const data = await disputeService.resolve(req.params.id, resolution, favor);
    sendSuccess(res, data);
  });

  return router;
}
