import { Router } from 'express';
import { body } from 'express-validator';
import { LiveStreamService } from './live-stream.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createLiveStreamRouter(liveStreamService: LiveStreamService) {
  const router = Router();

  router.get('/live', async (req, res) => {
    const result = await liveStreamService.getLiveStreams({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    sendSuccess(res, result);
  });

  router.get('/seller/live', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const result = await liveStreamService.getShopStreams(req.user!.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
    });
    sendSuccess(res, result);
  });

  router.post(
    '/seller/live',
    authenticate,
    authorize('SELLER_OWNER'),
    [body('title').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await liveStreamService.create(req.user!.id, req.body);
      sendSuccess(res, result, 'Stream created', 201);
    }
  );

  router.patch(
    '/seller/live/:id/status',
    authenticate,
    authorize('SELLER_OWNER'),
    [body('status').isIn(['LIVE', 'ENDED'])],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await liveStreamService.updateStatus(req.user!.id, req.params.id, req.body.status);
      sendSuccess(res, result);
    }
  );

  return router;
}
