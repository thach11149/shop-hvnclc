import { Router } from 'express';
import { body } from 'express-validator';
import { FinanceService } from './finance.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createFinanceRouter(financeService: FinanceService) {
  const router = Router();

  router.get('/seller/finance/ledger', authenticate, authorize('SELLER_OWNER', 'ADMIN_FINANCE'), async (req: AuthRequest, res) => {
    const result = await financeService.getSellerLedger(req.user!.shopId!, {
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.get('/seller/finance/summary', authenticate, authorize('SELLER_OWNER', 'ADMIN_FINANCE'), async (req: AuthRequest, res) => {
    const result = await financeService.getSellerFinanceSummary(req.user!.shopId!);
    sendSuccess(res, result);
  });

  router.post('/seller/withdrawals', authenticate, authorize('SELLER_OWNER'),
    [body('amount').isFloat({ min: 1 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await financeService.requestWithdrawal(req.user!.shopId!, req.body.amount, req.body.bankAccountId);
      sendSuccess(res, result, 'Withdrawal request submitted', 201);
    }
  );

  router.get('/admin/reports/sales', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req, res) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const result = await financeService.getSalesReport(startDate, endDate);
    sendSuccess(res, result);
  });

  router.get('/admin/finance/summary', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req, res) => {
    const days = Number(req.query.days) || 30;
    const result = await financeService.getAdminFinanceSummary(days);
    sendSuccess(res, result);
  });

  router.get('/seller/finance/report', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res) => {
    const days = Number(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await financeService.getSalesReport(startDate, new Date(), req.user!.shopId!);
    sendSuccess(res, result);
  });

  return router;
}
