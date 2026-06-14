import { Router } from 'express';
import { NotificationService } from './notification.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createNotificationRouter(notificationService: NotificationService) {
  const router = Router();

  router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
    const result = await notificationService.getUserNotifications(req.user!.id, {
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      unreadOnly: req.query.unreadOnly === 'true',
    });
    sendSuccess(res, result);
  });

  router.get('/notifications/unread-count', authenticate, async (req: AuthRequest, res) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    sendSuccess(res, { count });
  });

  router.patch('/notifications/:id/read', authenticate, async (req: AuthRequest, res) => {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    sendSuccess(res, null, 'Marked as read');
  });

  router.patch('/notifications/read-all', authenticate, async (req: AuthRequest, res) => {
    await notificationService.markAllRead(req.user!.id);
    sendSuccess(res, null, 'All notifications marked as read');
  });

  return router;
}
