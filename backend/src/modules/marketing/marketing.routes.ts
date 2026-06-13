import { Router, Response } from 'express';
import { MarketingService } from './marketing.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';

export function createMarketingRouter(marketingService: MarketingService): Router {
  const router = Router();

  router.get('/admin/marketing/segments', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const activeOnly = req.query.active === 'true';
    const data = await marketingService.listSegments(activeOnly);
    sendSuccess(res, data);
  });

  router.post('/admin/marketing/segments', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await marketingService.createSegment(req.body);
    sendSuccess(res, data, 'Tạo segment thành công', 201);
  });

  router.patch('/admin/marketing/segments/:id/toggle', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await marketingService.toggleSegment(req.params.id);
    sendSuccess(res, data);
  });

  router.post('/admin/marketing/segments/:id/recalculate', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await marketingService.recalculateSegment(req.params.id);
    sendSuccess(res, data, 'Đang tính lại số thành viên...');
  });

  router.get('/admin/marketing/flows', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const activeOnly = req.query.active === 'true';
    const data = await marketingService.listFlows(activeOnly);
    sendSuccess(res, data);
  });

  router.post('/admin/marketing/flows', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await marketingService.createFlow(req.body);
    sendSuccess(res, data, 'Tạo luồng automation thành công', 201);
  });

  router.patch('/admin/marketing/flows/:id/toggle', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await marketingService.toggleFlow(req.params.id);
    sendSuccess(res, data);
  });

  return router;
}
