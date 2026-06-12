import { Router } from 'express';
import { body } from 'express-validator';
import { UserService } from './user.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createUserRouter(userService: UserService) {
  const router = Router();

  router.get('/account', authenticate, async (req: AuthRequest, res) => {
    const profile = await userService.getProfile(req.user!.id);
    sendSuccess(res, profile);
  });

  router.patch('/account', authenticate, async (req: AuthRequest, res) => {
    const profile = await userService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, profile);
  });

  router.get('/account/addresses', authenticate, async (req: AuthRequest, res) => {
    const addresses = await userService.getAddresses(req.user!.id);
    sendSuccess(res, addresses);
  });

  router.post('/account/addresses', authenticate,
    [
      body('fullName').notEmpty(),
      body('phone').notEmpty(),
      body('addressLine').notEmpty(),
      body('district').notEmpty(),
      body('province').notEmpty(),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const address = await userService.addAddress(req.user!.id, req.body);
      sendSuccess(res, address, 'Address added', 201);
    }
  );

  router.patch('/account/addresses/:id', authenticate, async (req: AuthRequest, res) => {
    const address = await userService.updateAddress(req.user!.id, req.params.id, req.body);
    sendSuccess(res, address);
  });

  router.delete('/account/addresses/:id', authenticate, async (req: AuthRequest, res) => {
    await userService.deleteAddress(req.user!.id, req.params.id);
    sendSuccess(res, null, 'Address deleted');
  });

  router.get('/wishlist', authenticate, async (req: AuthRequest, res) => {
    const wishlist = await userService.getWishlist(req.user!.id);
    sendSuccess(res, wishlist);
  });

  router.post('/wishlist', authenticate, [body('productId').notEmpty()], validateRequest, async (req: AuthRequest, res) => {
    const item = await userService.addWishlist(req.user!.id, req.body.productId);
    sendSuccess(res, item, 'Added to wishlist', 201);
  });

  router.delete('/wishlist/:productId', authenticate, async (req: AuthRequest, res) => {
    await userService.removeWishlist(req.user!.id, req.params.productId);
    sendSuccess(res, null, 'Removed from wishlist');
  });

  router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
    const result = await userService.getNotifications(req.user!.id, Number(req.query.page), Number(req.query.limit));
    sendSuccess(res, result);
  });

  router.patch('/notifications/read', authenticate, async (req: AuthRequest, res) => {
    await userService.markNotificationsRead(req.user!.id, req.body.ids);
    sendSuccess(res, null, 'Notifications marked as read');
  });

  return router;
}
