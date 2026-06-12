import { Router } from 'express';
import { body } from 'express-validator';
import { AnalyticsService } from './analytics.service';
import { optionalAuth } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createAnalyticsRouter(analyticsService: AnalyticsService) {
  const router = Router();

  router.post('/events/track', optionalAuth,
    [body('eventType').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      await analyticsService.trackEvent({ ...req.body, userId: req.user?.id, ipAddress: req.ip, userAgent: req.get('user-agent') });
      sendSuccess(res, null, 'Event tracked');
    }
  );

  router.post('/events/batch-track', optionalAuth,
    [body('events').isArray({ min: 1 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      const events = req.body.events.map((e: Record<string, unknown>) => ({
        ...e,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }));
      await analyticsService.batchTrackEvents(events);
      sendSuccess(res, null, 'Events tracked');
    }
  );

  return router;
}
