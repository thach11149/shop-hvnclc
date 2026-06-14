import { Router } from 'express';
import { ExportService } from '../../shared/services/export.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { AuthRequest } from '../../shared/types';

export function createExportRouter(exportService: ExportService) {
  const router = Router();

  router.get('/admin/export/orders', authenticate, authorize('SUPER_ADMIN', 'ADMIN_FINANCE', 'ADMIN_OPERATOR'), async (req, res) => {
    await exportService.exportOrders(res, {
      from: req.query.from as string,
      to: req.query.to as string,
      status: req.query.status as string,
    });
  });

  router.get('/admin/export/products', authenticate, authorize('SUPER_ADMIN', 'ADMIN_CONTENT'), async (req, res) => {
    await exportService.exportProducts(res, {
      status: req.query.status as string,
      categoryId: req.query.categoryId as string,
    });
  });

  router.get('/admin/export/finance', authenticate, authorize('SUPER_ADMIN', 'ADMIN_FINANCE'), async (req, res) => {
    await exportService.exportFinance(res, {
      from: req.query.from as string,
      to: req.query.to as string,
    });
  });

  router.get('/seller/export/orders', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const shop = await (exportService as any).prisma.shop.findFirst({
      where: { sellerProfile: { userId: req.user!.id } },
      select: { id: true },
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    await exportService.exportOrders(res, {
      shopId: shop.id,
      from: req.query.from as string,
      to: req.query.to as string,
      status: req.query.status as string,
    });
  });

  router.get('/seller/export/products', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const shop = await (exportService as any).prisma.shop.findFirst({
      where: { sellerProfile: { userId: req.user!.id } },
      select: { id: true },
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    await exportService.exportProducts(res, {
      shopId: shop.id,
      status: req.query.status as string,
      categoryId: req.query.categoryId as string,
    });
  });

  router.get('/seller/export/finance', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res) => {
    const shop = await (exportService as any).prisma.shop.findFirst({
      where: { sellerProfile: { userId: req.user!.id } },
      select: { id: true },
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    await exportService.exportFinance(res, {
      shopId: shop.id,
      from: req.query.from as string,
      to: req.query.to as string,
    });
  });

  return router;
}
