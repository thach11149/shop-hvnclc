import { Router } from 'express';
import { body } from 'express-validator';
import { SystemConfigService } from './system-config.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createSystemConfigRouter(systemConfigService: SystemConfigService) {
  const router = Router();

  router.get('/system/config/public', async (_req, res) => {
    const result = await systemConfigService.getPublicConfigs();
    sendSuccess(res, result);
  });

  router.get('/admin/system/config', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    const result = await systemConfigService.getAll(req.query.group as string);
    sendSuccess(res, result);
  });

  router.get('/admin/system/config/:key', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    const result = await systemConfigService.getByKey(req.params.key);
    sendSuccess(res, result);
  });

  router.put(
    '/admin/system/config',
    authenticate,
    authorize('SUPER_ADMIN'),
    [body('key').notEmpty(), body('value').exists()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await systemConfigService.upsert(req.user!.id, req.body);
      sendSuccess(res, result);
    }
  );

  router.delete('/admin/system/config/:key', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
    const result = await systemConfigService.delete(req.params.key);
    sendSuccess(res, result);
  });

  return router;
}
