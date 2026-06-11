import { Router } from 'express';
import { body } from 'express-validator';
import { ReturnRefundService } from './return-refund.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createReturnRefundRouter(service: ReturnRefundService) {
  const router = Router();

  router.post('/orders/:id/return-requests', authenticate, authorize('BUYER'),
    [
      body('type').isIn(['RETURN', 'REFUND_ONLY', 'EXCHANGE']),
      body('reason').notEmpty(),
      body('items').isArray({ min: 1 }),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await service.createReturnRequest(req.user!.id, req.params.id, req.body);
      sendSuccess(res, result, 'Return request submitted', 201);
    }
  );

  router.get('/seller/return-requests', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const result = await service.getSellerReturnRequests(req.user!.shopId!, {
      status: req.query.status as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.patch('/seller/return-requests/:id/approve', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res) => {
    const result = await service.sellerApproveReturn(req.params.id, req.user!.shopId!, req.body.note);
    sendSuccess(res, result);
  });

  router.patch('/seller/return-requests/:id/reject', authenticate, authorize('SELLER_OWNER'),
    [body('note').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await service.sellerRejectReturn(req.params.id, req.user!.shopId!, req.body.note);
      sendSuccess(res, result);
    }
  );

  router.get('/admin/return-requests', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const result = await service.getAdminReturnRequests({
      status: req.query.status as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.patch('/admin/return-requests/:id/resolve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const result = await service.processRefund(req.params.id, req.user!.id);
    sendSuccess(res, result);
  });

  return router;
}
