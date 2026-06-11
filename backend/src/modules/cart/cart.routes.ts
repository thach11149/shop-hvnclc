import { Router } from 'express';
import { body } from 'express-validator';
import { CartService } from './cart.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createCartRouter(cartService: CartService) {
  const router = Router();

  router.get('/cart', authenticate, authorize('BUYER'), async (req: AuthRequest, res) => {
    const cart = await cartService.getCart(req.user!.id);
    sendSuccess(res, cart);
  });

  router.post('/cart/items', authenticate, authorize('BUYER'),
    [body('skuId').notEmpty(), body('quantity').isInt({ min: 1 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      const cart = await cartService.addItem(req.user!.id, req.body.skuId, req.body.quantity);
      sendSuccess(res, cart);
    }
  );

  router.patch('/cart/items/:itemId', authenticate, authorize('BUYER'),
    [body('quantity').isInt({ min: 0 })],
    validateRequest,
    async (req: AuthRequest, res) => {
      const cart = await cartService.updateItem(req.user!.id, req.params.itemId, req.body.quantity);
      sendSuccess(res, cart);
    }
  );

  router.delete('/cart/items/:itemId', authenticate, authorize('BUYER'), async (req: AuthRequest, res) => {
    const cart = await cartService.removeItem(req.user!.id, req.params.itemId);
    sendSuccess(res, cart);
  });

  return router;
}
