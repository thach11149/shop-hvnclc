import { Router } from 'express';
import { body, query } from 'express-validator';
import fs from 'fs';
import XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { CatalogService } from './catalog.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { uploadProductImport } from '../../shared/middleware/upload.middleware';
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

  router.get('/seller/products/:id', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res) => {
    const product = await catalogService.getSellerProductById(req.params.id, req.user!.shopId!);
    sendSuccess(res, product);
  });

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

  // ============================================================
  // BULK IMPORT
  // ============================================================

  router.get('/seller/products/import-template', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), (_req, res) => {
    const wb = XLSX.utils.book_new();
    const headers = ['name', 'category_slug', 'description', 'brand', 'sku_name', 'price', 'stock', 'weight'];
    const sample = [headers, ['Sản phẩm mẫu', 'dien-tu', 'Mô tả sản phẩm', 'Brand', 'SKU mặc định', '100000', '50', '0.5']];
    const ws = XLSX.utils.aoa_to_sheet(sample);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=product-import-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });

  router.post('/seller/products/import', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'),
    uploadProductImport.single('file'),
    async (req: AuthRequest, res) => {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const filePath = req.file.path;
      let imported = 0;
      let errors: string[] = [];

      try {
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const name = row.name || row['Tên sản phẩm'];
            const categorySlug = row.category_slug || row['Danh mục'];
            const price = Number(row.price || row['Giá'] || 0);
            const stock = Number(row.stock || row['Tồn kho'] || 0);

            if (!name || !categorySlug || !price) {
              errors.push(`Row ${i + 2}: Missing name, category, or price`);
              continue;
            }

            const category = await catalogService['prisma'].category.findFirst({
              where: { OR: [{ slug: categorySlug }, { name: categorySlug }] },
            });

            if (!category) {
              errors.push(`Row ${i + 2}: Category "${categorySlug}" not found`);
              continue;
            }

            const shopProfile = await catalogService['prisma'].sellerProfile.findUnique({
              where: { userId: req.user!.id },
              include: { shop: true },
            });

            if (!shopProfile?.shop) {
              errors.push(`Row ${i + 2}: Seller shop not found`);
              break;
            }

            const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${uuidv4().slice(0, 6)}`;

            await catalogService['prisma'].product.create({
              data: {
                id: uuidv4(),
                shopId: shopProfile.shop.id,
                categoryId: category.id,
                name,
                slug,
                description: row.description || row['Mô tả'] || '',
                brand: row.brand || row['Thương hiệu'] || undefined,
                status: 'PENDING_APPROVAL',
                skus: {
                  create: [{
                    id: uuidv4(),
                    skuCode: `SKU-${uuidv4().slice(0, 8).toUpperCase()}`,
                    name: row.sku_name || row['SKU'] || 'Mặc định',
                    price,
                    comparePrice: price,
                    isActive: true,
                    inventoryStock: {
                      create: {
                        id: uuidv4(),
                        totalQuantity: stock,
                        reservedQuantity: 0,
                        soldQuantity: 0,
                      },
                    },
                  }],
                },
              },
            });
            imported++;
          } catch (rowErr) {
            errors.push(`Row ${i + 2}: ${(rowErr as Error).message}`);
          }
        }

        sendSuccess(res, { imported, errors, total: rows.length }, `${imported}/${rows.length} products imported`);
      } finally {
        fs.unlink(filePath, () => {});
      }
    },
  );

  return router;
}
