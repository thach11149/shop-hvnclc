import { Router } from 'express';
import { body } from 'express-validator';
import { AnnouncementService } from './announcement.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createAnnouncementRouter(announcementService: AnnouncementService) {
  const router = Router();

  router.get('/announcements', async (req, res) => {
    const result = await announcementService.list({
      target: req.query.target as string,
      type: req.query.type as string,
      active: true,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    sendSuccess(res, result);
  });

  router.get('/admin/announcements', authenticate, authorize('SUPER_ADMIN', 'ADMIN_CONTENT'), async (req, res) => {
    const result = await announcementService.list({
      target: req.query.target as string,
      type: req.query.type as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    sendSuccess(res, result);
  });

  router.post(
    '/admin/announcements',
    authenticate,
    authorize('SUPER_ADMIN', 'ADMIN_CONTENT'),
    [body('title').notEmpty(), body('content').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await announcementService.create(req.user!.id, req.body);
      sendSuccess(res, result, 'Announcement created', 201);
    }
  );

  router.patch(
    '/admin/announcements/:id',
    authenticate,
    authorize('SUPER_ADMIN', 'ADMIN_CONTENT'),
    async (req: AuthRequest, res) => {
      const result = await announcementService.update(req.params.id, req.body);
      sendSuccess(res, result);
    }
  );

  router.delete(
    '/admin/announcements/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    async (req: AuthRequest, res) => {
      const result = await announcementService.delete(req.params.id);
      sendSuccess(res, result);
    }
  );

  return router;
}
