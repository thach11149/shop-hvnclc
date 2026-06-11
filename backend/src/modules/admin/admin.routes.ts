import { Router } from 'express';
import { AdminService } from './admin.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createAdminRouter(adminService: AdminService) {
  const router = Router();

  router.get('/admin/dashboard', authenticate, authorize('ADMIN_OPERATOR', 'ADMIN_FINANCE', 'ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const data = await adminService.getDashboard();
    sendSuccess(res, data);
  });

  router.get('/admin/users', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const result = await adminService.getUsers({
      status: req.query.status as string,
      role: req.query.role as string,
      search: req.query.search as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.patch('/admin/users/:id/status', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const user = await adminService.updateUserStatus(req.params.id, req.body.status, req.user!.id);
    sendSuccess(res, user);
  });

  router.get('/admin/banners', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const banners = await adminService.getBanners();
    sendSuccess(res, banners);
  });

  router.post('/admin/banners', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const banner = await adminService.createBanner(req.body);
    sendSuccess(res, banner, 'Banner created', 201);
  });

  router.patch('/admin/banners/:id', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const banner = await adminService.updateBanner(req.params.id, req.body);
    sendSuccess(res, banner);
  });

  router.delete('/admin/banners/:id', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    await adminService.deleteBanner(req.params.id);
    sendSuccess(res, null, 'Banner deleted');
  });

  router.get('/admin/withdrawals', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req, res) => {
    const result = await adminService.getWithdrawalRequests({
      status: req.query.status as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.patch('/admin/withdrawals/:id', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const result = await adminService.processWithdrawal(req.params.id, req.body.status, req.user!.id, req.body.note);
    sendSuccess(res, result);
  });

  return router;
}
