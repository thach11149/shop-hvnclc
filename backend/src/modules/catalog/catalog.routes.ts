import { Router } from 'express';
import { body, query } from 'express-validator';
import { CatalogService } from './catalog.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createCatalogRouter(catalogService: CatalogService) {
  const router = Router();

  // Public routes
  router.get('/categories', async (req, res) => {
    const categories = await catalogService.getCategories(req.query.parentId as string);
    sendSuccess(res, categories);
  });

  router.get('/categories/:slug', async (req, res) => {
    const category = await catalogService.getCategoryBySlug(req.params.slug);
    sendSuccess(res, category);
  });

  router.get('/products', async (req, res) => {
    const result = await catalogService.getProducts({
      categoryId: req.query.categoryId as string,
      shopId: req.query.shopId as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sort: req.query.sort as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    sendSuccess(res, result);
  });

  router.get('/products/:slug', async (req, res) => {
    const product = await catalogService.getProductBySlug(req.params.slug);
    sendSuccess(res, product);
  });

  // Seller routes
  router.get('/seller/products', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const result = await catalogService.getSellerProducts(req.user!.shopId!, {
      status: req.query.status as Parameters<typeof catalogService.getSellerProducts>[1]['status'],
      search: req.query.search as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, result);
  });

  router.post('/seller/products', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'),
    [
      body('name').notEmpty(),
      body('categoryId').notEmpty(),
      body('skus').isArray({ min: 1 }),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      const product = await catalogService.createProduct(req.user!.shopId!, req.body);
      sendSuccess(res, product, 'Product created', 201);
    }
  );

  router.patch('/seller/products/:id', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const product = await catalogService.updateProduct(req.params.id, req.user!.shopId!, req.body);
    sendSuccess(res, product);
  });

  router.post('/seller/products/:id/submit-approval', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res) => {
    const product = await catalogService.submitForApproval(req.params.id, req.user!.shopId!);
    sendSuccess(res, product);
  });

  // Admin routes
  router.get('/admin/products/pending', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res) => {
    const result = await catalogService.getPendingProducts({ page: Number(req.query.page), limit: Number(req.query.limit) });
    sendSuccess(res, result);
  });

  router.patch('/admin/products/:id/approve', authenticate, authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const product = await catalogService.approveProduct(req.params.id, req.user!.id);
    sendSuccess(res, product);
  });

  router.patch('/admin/products/:id/reject',
    authenticate,
    authorize('ADMIN_CONTENT', 'ADMIN_OPERATOR', 'SUPER_ADMIN'),
    [body('reason').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const product = await catalogService.rejectProduct(req.params.id, req.user!.id, req.body.reason);
      sendSuccess(res, product);
    }
  );

  router.post('/admin/categories', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'),
    [body('name').notEmpty(), body('slug').notEmpty()],
    validateRequest,
    async (req: AuthRequest, res) => {
      const category = await catalogService.createCategory(req.body, req.user!.id);
      sendSuccess(res, category, 'Category created', 201);
    }
  );

  router.patch('/admin/categories/:id', authenticate, authorize('ADMIN_CONTENT', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
    const category = await catalogService.updateCategory(req.params.id, req.body, req.user!.id);
    sendSuccess(res, category);
  });

  return router;
}
