import { Router } from 'express';
import { body } from 'express-validator';
import { AnalyticsService } from './analytics.service';
import { optionalAuth, authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { withCache } from '../../shared/middleware/cache.middleware';
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

  // ============================================================
  // ADMIN ANALYTICS
  // ============================================================

  router.get('/admin/analytics/summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR', 'ADMIN_FINANCE'),
    withCache(120),
    async (req: AuthRequest, res) => {
      const period = Number(req.query.period) || 30;
      const result = await analyticsService.getAdminSummary(period);
      sendSuccess(res, result);
    }
  );

  router.get('/admin/analytics/orders', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR', 'ADMIN_FINANCE'),
    withCache(120),
    async (req: AuthRequest, res) => {
      const period = Number(req.query.period) || 30;
      const result = await analyticsService.getOrderAnalytics(period);
      sendSuccess(res, result);
    }
  );

  router.get('/admin/analytics/top-sellers', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR', 'ADMIN_FINANCE'),
    withCache(300),
    async (req, res) => {
      const result = await analyticsService.getTopSellers(Number(req.query.days) || 30, Number(req.query.limit) || 10);
      sendSuccess(res, result);
    }
  );

  router.get('/admin/analytics/top-categories', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR', 'ADMIN_FINANCE'),
    withCache(300),
    async (req, res) => {
      const result = await analyticsService.getTopCategories(Number(req.query.days) || 30, Number(req.query.limit) || 10);
      sendSuccess(res, result);
    }
  );

  router.get('/admin/analytics/realtime', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    async (_req, res) => {
      const result = await analyticsService.getRealtimeMetrics();
      sendSuccess(res, result);
    }
  );

  router.get('/admin/fraud/cases/summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    withCache(60),
    async (_req, res) => {
      const result = await analyticsService.getFraudCasesSummary();
      sendSuccess(res, result);
    }
  );

  return router;
}
