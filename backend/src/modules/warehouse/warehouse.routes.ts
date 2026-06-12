import { Router, Response } from 'express';
import { WarehouseService } from './warehouse.service';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import type { AuthRequest } from '../../shared/types';

export function createWarehouseRouter(warehouseService: WarehouseService): Router {
  const router = Router();

  // Admin routes
  router.get('/admin/warehouses', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await warehouseService.listWarehouses();
    sendSuccess(res, data);
  });

  router.post('/admin/warehouses', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await warehouseService.createWarehouse(req.body);
    sendSuccess(res, data, 'Kho hàng đã được tạo', 201);
  });

  router.patch('/admin/warehouses/:id/toggle', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await warehouseService.toggleWarehouse(req.params.id);
    sendSuccess(res, data);
  });

  router.get('/admin/fulfillment', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req, res: Response) => {
    const data = await warehouseService.listFulfillmentOrders(req.query.type as string);
    sendSuccess(res, data);
  });

  router.get('/admin/fulfillment/inventory', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = await warehouseService.getWarehouseInventory();
    sendSuccess(res, data);
  });

  // Seller routes
  router.get('/seller/warehouse/inventory', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await warehouseService.getInventory(req.user!.shopId!, req.query.search as string);
    sendSuccess(res, data);
  });

  router.post('/seller/warehouse/inventory/:id/adjust', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const { qty, reason } = req.body;
    const data = await warehouseService.adjustInventory(req.params.id, req.user!.shopId!, qty, reason);
    sendSuccess(res, data);
  });

  router.get('/seller/warehouse/inbound', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await warehouseService.listInboundOrders(req.user!.shopId!);
    sendSuccess(res, data);
  });

  router.post('/seller/warehouse/inbound', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const { warehouseCode, items } = req.body;
    const data = await warehouseService.createInboundOrder(req.user!.shopId!, warehouseCode, items);
    sendSuccess(res, data, 'Phiếu nhập kho đã được tạo', 201);
  });

  router.post('/seller/warehouse/inbound/:id/submit', authenticate, authorize('SELLER_OWNER'), async (req: AuthRequest, res: Response) => {
    const data = await warehouseService.submitInboundOrder(req.params.id, req.user!.shopId!);
    sendSuccess(res, data);
  });

  return router;
}
