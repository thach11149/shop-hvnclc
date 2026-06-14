import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { AuditLogService } from './audit-log.service';

export function auditMiddleware(auditLogService: AuditLogService) {
  const AUDITABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

  const ACTION_MAP: Record<string, string> = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  const ENTITY_MAP: Record<string, string> = {
    '/products': 'PRODUCT',
    '/sellers': 'SELLER',
    '/users': 'USER',
    '/orders': 'ORDER',
    '/promotions': 'PROMOTION',
    '/categories': 'CATEGORY',
    '/disputes': 'DISPUTE',
    '/reviews': 'REVIEW',
    '/campaigns': 'CAMPAIGN',
    '/banners': 'BANNER',
  };

  function detectEntity(path: string): { entityType: string; entityId: string } {
    for (const [prefix, type] of Object.entries(ENTITY_MAP)) {
      if (path.includes(prefix)) {
        const segments = path.split('/').filter(Boolean);
        const prefixSegment = prefix.replace('/', '');
        const idx = segments.indexOf(prefixSegment);
        const entityId = idx >= 0 && segments[idx + 1] ? segments[idx + 1] : 'N/A';
        return { entityType: type, entityId };
      }
    }
    return { entityType: 'SYSTEM', entityId: 'N/A' };
  }

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!AUDITABLE_METHODS.includes(req.method) || !req.user) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const { entityType, entityId } = detectEntity(req.path);
        const action = ACTION_MAP[req.method] || req.method;

        auditLogService
          .log({
            actorId: req.user.id,
            actorType: req.user.role,
            action,
            entityType,
            entityId,
            newValue: req.body,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            requestId: req.headers['x-request-id'] as string,
          })
          .catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}
