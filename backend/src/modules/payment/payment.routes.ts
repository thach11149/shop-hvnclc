import { Router, Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createPaymentRouter(paymentService: PaymentService) {
  const router = Router();

  // Buyer initiates payment for an order
  router.post('/payments/:orderId/initiate', authenticate, authorize('BUYER'), async (req: AuthRequest, res: Response) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const result = await paymentService.initiatePayment(req.params.orderId, req.user!.id, ip);
    sendSuccess(res, result);
  });

  // Get payment status for an order
  router.get('/payments/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.getPaymentByOrderId(req.params.orderId);
    sendSuccess(res, payment);
  });

  // VNPay return URL (GET, browser redirect)
  router.get('/payments/vnpay/return', async (req: Request, res: Response) => {
    try {
      const result = await paymentService.handleVnpayReturn(req.query as Record<string, string>);
      const frontendUrl = process.env.BUYER_WEB_URL || 'http://localhost:5173';
      const isPaid = (result as { status: string }).status === 'PAID';
      const orderId = (result as { orderId?: string }).orderId || '';
      res.redirect(`${frontendUrl}/payment/result?status=${isPaid ? 'success' : 'failed'}&orderId=${orderId}`);
    } catch {
      res.redirect(`${process.env.BUYER_WEB_URL || 'http://localhost:5173'}/payment/result?status=error`);
    }
  });

  // MoMo IPN callback (POST)
  router.post('/payments/momo/callback', async (req: Request, res: Response) => {
    await paymentService.handleMomoCallback(req.body);
    res.json({ status: 0, message: 'Confirmed' });
  });

  // ZaloPay callback (POST)
  router.post('/payments/zalopay/callback', async (req: Request, res: Response) => {
    const result = await paymentService.handleZalopayCallback(req.body);
    res.json({ return_code: 1, return_message: 'success', result });
  });

  return router;
}
