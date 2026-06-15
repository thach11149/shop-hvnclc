import { Router } from 'express';
import { AdminService } from './admin.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  router.patch('/admin/withdrawals/:id/process', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const { action, transactionRef } = req.body;
    const status = action === 'APPROVE' ? 'COMPLETED' : 'REJECTED';
    const result = await adminService.processWithdrawal(req.params.id, status, req.user!.id, transactionRef);
    sendSuccess(res, result);
  });

  router.patch('/admin/withdrawals/:id', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const result = await adminService.processWithdrawal(req.params.id, req.body.status, req.user!.id, req.body.note);
    sendSuccess(res, result);
  });

  // Admin categories CRUD
  router.post('/admin/categories', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const category = await prisma.category.create({
      data: {
        name: req.body.name,
        slug: req.body.slug,
        image: req.body.icon || null,
        parentId: req.body.parentId || null,
        isActive: true,
      },
      include: { parent: true, _count: { select: { products: true } } },
    });
    sendSuccess(res, { ...category, icon: category.image }, 'Category created', 201);
  });

  router.patch('/admin/categories/:id', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        slug: req.body.slug,
        image: req.body.icon || null,
        parentId: req.body.parentId || null,
      },
      include: { parent: true, _count: { select: { products: true } } },
    });
    sendSuccess(res, { ...category, icon: category.image });
  });

  // Admin promotions
  router.get('/admin/promotions', authenticate, authorize('ADMIN_OPERATOR', 'ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const promotions = await prisma.promotion.findMany({
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, { data: promotions, total: promotions.length });
  });

  router.post('/admin/promotions', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const { name, code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate } = req.body;
    const promotion = await prisma.promotion.create({
      data: {
        name,
        code: code || null,
        type: 'PLATFORM' as any,
        discountType: (discountType || 'PERCENTAGE') as any,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit || null,
        isActive: true,
        startAt: new Date(startDate),
        endAt: new Date(endDate),
      },
    });
    sendSuccess(res, promotion, 'Promotion created', 201);
  });

  // Admin return requests
  router.get('/admin/return-requests', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const returns = await prisma.returnRequest.findMany({
      include: {
        order: { select: { orderNumber: true } },
        refundRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const returnsWithUser = await Promise.all(returns.map(async r => {
      const u = await prisma.user.findUnique({ where: { id: r.userId }, select: { email: true } });
      return { ...r, user: u };
    }));
    sendSuccess(res, { data: returnsWithUser, total: returnsWithUser.length });
  });

  router.post('/admin/return-requests/:id/refund', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const returnReq = await prisma.returnRequest.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!returnReq) { res.status(404).json({ error: 'Return request not found' }); return; }
    await prisma.returnRequest.update({ where: { id: req.params.id }, data: { status: 'COMPLETED' } });
    sendSuccess(res, { success: true });
  });

  // Admin orders
  router.get('/admin/orders', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { email: true } }, shop: { select: { name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    sendSuccess(res, { data: orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  });

  // Admin products
  router.get('/admin/products', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const products = await prisma.product.findMany({
      where,
      include: { images: true, shop: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, { data: products, total: products.length });
  });

  router.patch('/admin/products/:id/approve', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });
    sendSuccess(res, product);
  });

  router.patch('/admin/products/:id/reject', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: req.body.reason },
    });
    sendSuccess(res, product);
  });

  // === ADMIN PRODUCTS EXTENDED (added by agent3) ===
  router.patch('/admin/products/:id/status', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const { status, reason } = req.body;
    const data: any = { status };
    if (reason) data.rejectionReason = reason;
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    sendSuccess(res, product);
  });

  router.patch('/admin/products/bulk-status', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const { productIds, status, reason } = req.body;
    const data: any = { status };
    if (reason) data.rejectionReason = reason;
    await prisma.product.updateMany({ where: { id: { in: productIds } }, data });
    sendSuccess(res, { updated: productIds.length });
  });

  router.get('/admin/products/:id', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        images: true,
        shop: { select: { name: true } },
        category: { select: { name: true } },
        variants: true,
      },
    });
    sendSuccess(res, product);
  });

  // === BANNERS REORDER (added by agent3) ===
  router.patch('/admin/banners/reorder', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const { orderedIds } = req.body as { orderedIds: string[] };
    await Promise.all(orderedIds.map((id: string, idx: number) =>
      prisma.banner.update({ where: { id }, data: { sortOrder: idx } })
    ));
    sendSuccess(res, { reordered: orderedIds.length });
  });

  router.get('/admin/banners/all', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req, res) => {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    sendSuccess(res, { data: banners });
  });

  // === PROMOTIONS EXTENDED (added by agent3) ===
  router.patch('/admin/promotions/:id', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const { name, code, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code || null;
    if (discountValue !== undefined) data.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ? Number(minOrderAmount) : null;
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (usageLimit !== undefined) data.usageLimit = usageLimit || null;
    if (startDate !== undefined) data.startAt = new Date(startDate);
    if (endDate !== undefined) data.endAt = new Date(endDate);
    if (isActive !== undefined) data.isActive = isActive;
    const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data });
    sendSuccess(res, promotion);
  });

  router.patch('/admin/promotions/:id/toggle', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const promo = await prisma.promotion.findUniqueOrThrow({ where: { id: req.params.id } });
    const updated = await prisma.promotion.update({ where: { id: req.params.id }, data: { isActive: !promo.isActive } });
    sendSuccess(res, updated);
  });

  router.delete('/admin/promotions/:id', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Promotion deleted');
  });

  // === RETURN REQUESTS EXTENDED (added by agent3) ===
  router.patch('/admin/return-requests/:id/approve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const updated = await prisma.returnRequest.update({
      where: { id: req.params.id },
      data: { status: 'SELLER_APPROVED' },
    });
    sendSuccess(res, updated);
  });

  router.patch('/admin/return-requests/:id/reject', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const updated = await prisma.returnRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', rejectionReason: req.body.reason } as any,
    });
    sendSuccess(res, updated);
  });

  router.patch('/admin/return-requests/bulk-approve', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const { ids } = req.body as { ids: string[] };
    await prisma.returnRequest.updateMany({ where: { id: { in: ids }, status: 'PENDING' }, data: { status: 'SELLER_APPROVED' } });
    sendSuccess(res, { updated: ids.length });
  });

  // === WITHDRAWALS BULK (added by agent3) ===
  router.patch('/admin/withdrawals/bulk-approve', authenticate, authorize('ADMIN_FINANCE', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const { ids } = req.body as { ids: string[] };
    for (const id of ids) {
      try { await adminService.processWithdrawal(id, 'COMPLETED', req.user!.id, 'Bulk approved'); } catch {}
    }
    sendSuccess(res, { processed: ids.length });
  });

  return router;
}
