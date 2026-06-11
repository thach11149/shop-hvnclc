import { Router } from 'express';
import { body } from 'express-validator';
import { OrderService } from './order.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';
import { PaymentMethod, OrderStatus } from '@prisma/client';

export function createOrderRouter(orderService: OrderService) {
  const router = Router();

  // Buyer routes
  router.post('/checkout/preview', authenticate, authorize('BUYER'), async (req: AuthRequest, res) => {
    const result = await orderService.previewCheckout(req.user!.id, req.body);
    sendSuccess(res, result);
  });

  router.post('/orders', authenticate, authorize('BUYER'),
    [
      body('items').isArray({ min: 1 }),
      body('shippingAddressId').notEmpty(),
      body('paymentMethod').isIn(Object.values(PaymentMethod)),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const orders = await orderService.createOrder(req.user!.id, req.body);
      sendSuccess(res, orders, 'Orders created', 201);
    }
  );

  router.get('/orders', authenticate, authorize('BUYER'), async (req: AuthRequest, res) => {
    const result = await orderService.getBuyerOrders(req.user!.id, {
      status: req.query.status as OrderStatus,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.get('/orders/:id', authenticate, authorize('BUYER'), async (req: AuthRequest, res) => {
    const order = await orderService.getOrderById(req.params.id, req.user!.id);
    sendSuccess(res, order);
  });

  router.post('/orders/:id/cancel', authenticate, authorize('BUYER'),
    [body('reason').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const result = await orderService.cancelOrder(req.params.id, req.user!.id, req.body.reason);
      sendSuccess(res, result);
    }
  );

  // Seller routes
  router.get('/seller/orders', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const result = await orderService.getSellerOrders(req.user!.shopId!, {
      status: req.query.status as OrderStatus,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.get('/seller/orders/:id', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const sellerOrders = await orderService.getSellerOrders(req.user!.shopId!, {});
    const order = sellerOrders.data.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    sendSuccess(res, order);
  });

  router.patch('/seller/orders/:id/confirm', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const order = await orderService.sellerConfirmOrder(req.params.id, req.user!.shopId!);
    sendSuccess(res, order);
  });

  router.patch('/seller/orders/:id/pack', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const order = await orderService.sellerPackOrder(req.params.id, req.user!.shopId!);
    sendSuccess(res, order);
  });

  // Admin routes
  router.get('/admin/orders', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const result = await orderService.getAdminOrders({
      status: req.query.status as OrderStatus,
      shopId: req.query.shopId as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.patch('/admin/orders/:id/complete', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const order = await orderService.markOrderDelivered(req.params.id, req.user!.id);
    sendSuccess(res, order);
  });

  return router;
}
