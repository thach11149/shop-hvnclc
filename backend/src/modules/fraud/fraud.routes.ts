import { Router, Response } from 'express';
import { FraudService } from './fraud.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';

export function createFraudRouter(fraudService: FraudService): Router {
  const router = Router();

  router.get('/admin/fraud/cases', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await fraudService.listCases(req.query.status as string);
    sendSuccess(res, data);
  });

  router.patch('/admin/fraud/cases/:id', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await fraudService.updateCaseStatus(req.params.id, req.body.status);
    sendSuccess(res, data);
  });

  router.get('/admin/fraud/risk-scores', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await fraudService.getRiskScores(
      (req.query.entityType as string) || 'USER',
      Number(req.query.minScore) || 50,
    );
    sendSuccess(res, data);
  });

  router.get('/admin/ai/fraud-alerts', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await fraudService.listAIFraudAlerts(req.query.status as string);
    sendSuccess(res, data);
  });

  router.patch('/admin/ai/fraud-alerts/:id', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await fraudService.updateAlertStatus(req.params.id, req.body.status);
    sendSuccess(res, data);
  });

  return router;
}
