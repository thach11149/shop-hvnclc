import { Router } from 'express';
import { AuditLogService } from './audit-log.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createAuditLogRouter(auditLogService: AuditLogService) {
  const router = Router();

  router.get(
    '/admin/audit-logs',
    authenticate,
    authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    async (req: AuthRequest, res) => {
      const result = await auditLogService.getLogs({
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        actorId: req.query.actorId as string,
        action: req.query.action as string,
        from: req.query.from as string,
        to: req.query.to as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50,
      });
      sendSuccess(res, result);
    }
  );

  router.get(
    '/admin/audit-logs/entity/:type/:id',
    authenticate,
    authorize('SUPER_ADMIN', 'ADMIN_OPERATOR'),
    async (req: AuthRequest, res) => {
      const result = await auditLogService.getEntityHistory(req.params.type, req.params.id);
      sendSuccess(res, result);
    }
  );

  return router;
}
