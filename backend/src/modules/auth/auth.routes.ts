import { Router } from 'express';
import { body } from 'express-validator';
import { AuthService } from './auth.service';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';
import { validateRequest } from '../../shared/middleware/validate.middleware';

export function createAuthRouter(authService: AuthService) {
  const router = Router();

  router.post(
    '/register',
    [
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 6 }),
      body('phone').optional().isMobilePhone('any'),
    ],
    validateRequest,
    async (req, res) => {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registered successfully', 201);
    }
  );

  router.post(
    '/login',
    [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
    validateRequest,
    async (req, res) => {
      const result = await authService.login(req.body.email, req.body.password);
      sendSuccess(res, result, 'Login successful');
    }
  );

  router.post(
    '/refresh-token',
    [body('refreshToken').notEmpty()],
    validateRequest,
    async (req, res) => {
      const result = await authService.refreshToken(req.body.refreshToken);
      sendSuccess(res, result);
    }
  );

  router.post('/logout', authenticate, async (req: AuthRequest, res) => {
    await authService.logout(req.user!.id, req.body.refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  });

  router.post(
    '/forgot-password',
    [body('email').isEmail().normalizeEmail()],
    validateRequest,
    async (req, res) => {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    }
  );

  router.post(
    '/reset-password',
    [body('token').notEmpty(), body('newPassword').isLength({ min: 6 })],
    validateRequest,
    async (req, res) => {
      const result = await authService.resetPassword(req.body.token, req.body.newPassword);
      sendSuccess(res, result);
    }
  );

  return router;
}
