import { Router, Response } from 'express';
import { AiService } from './ai.service';
import { authenticate, authorize, optionalAuth } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import type { AuthRequest } from '../../shared/types';

export function createAiRouter(aiService: AiService): Router {
  const router = Router();

  // Buyer: AI shopping assistant
  router.post('/ai/shopping-assistant', optionalAuth, async (req: AuthRequest, res: Response) => {
    const { message, history = [] } = req.body;
    const data = await aiService.shoppingAssistantChat(message, history);
    sendSuccess(res, data);
  });

  // Seller: AI listing generator
  router.post('/seller/ai/listing', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const { productName, features } = req.body;
    const data = await aiService.generateListing(req.user!.shopId!, productName, features);
    sendSuccess(res, data);
  });

  // Seller: bulk price suggestions (must be before :productId route)
  router.get('/seller/ai/price-suggestion/bulk', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await aiService.getBulkPriceSuggestions(req.user!.shopId!);
    sendSuccess(res, data);
  });

  // Seller: price suggestion for single product
  router.post('/seller/ai/price-suggestion/:productId', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await aiService.getPriceSuggestion(req.user!.shopId!, req.params.productId);
    sendSuccess(res, data);
  });

  // Seller: inventory forecast
  router.get('/seller/ai/inventory-forecast', authenticate, authorize('SELLER_OWNER', 'SELLER_STAFF'), async (req: AuthRequest, res: Response) => {
    const data = await aiService.getInventoryForecast(req.user!.shopId!);
    sendSuccess(res, data);
  });

  // Admin: demand forecast
  router.get('/admin/ai/demand-forecast', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
    const categoryId = req.query.categoryId as string | undefined;
    const lowStock = req.query.lowStock === 'true';
    const data = await aiService.getDemandForecast(categoryId, lowStock);
    sendSuccess(res, data);
  });

  // Admin: ML model monitoring
  router.get('/admin/ai/models', authenticate, authorize('ADMIN_OPERATOR', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const data = aiService.getMLModels();
    sendSuccess(res, data);
  });

  return router;
}
