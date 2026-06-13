import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import { logger } from './shared/utils/logger';
import { setEventPrisma } from './shared/events/event-publisher';

import { AuthService } from './modules/auth/auth.service';
import { createAuthRouter } from './modules/auth/auth.routes';

import { UserService } from './modules/user/user.service';
import { createUserRouter } from './modules/user/user.routes';

import { SellerService } from './modules/seller/seller.service';
import { createSellerRouter } from './modules/seller/seller.routes';

import { CatalogService } from './modules/catalog/catalog.service';
import { createCatalogRouter } from './modules/catalog/catalog.routes';

import { InventoryService } from './modules/inventory/inventory.service';

import { CartService } from './modules/cart/cart.service';
import { createCartRouter } from './modules/cart/cart.routes';

import { PromotionService } from './modules/promotion/promotion.service';

import { OrderService } from './modules/order/order.service';
import { createOrderRouter } from './modules/order/order.routes';

import { FinanceService } from './modules/finance/finance.service';
import { createFinanceRouter } from './modules/finance/finance.routes';

import { ReviewService } from './modules/review/review.service';
import { createReviewRouter } from './modules/review/review.routes';

import { AdminService } from './modules/admin/admin.service';
import { createAdminRouter } from './modules/admin/admin.routes';

import { SearchService } from './modules/search/search.service';
import { createSearchRouter } from './modules/search/search.routes';

import { ReturnRefundService } from './modules/return-refund/return-refund.service';
import { createReturnRefundRouter } from './modules/return-refund/return-refund.routes';

import { CampaignService } from './modules/campaign/campaign.service';
import { createCampaignRouter } from './modules/campaign/campaign.routes';

import { AnalyticsService } from './modules/analytics/analytics.service';
import { createAnalyticsRouter } from './modules/analytics/analytics.routes';
import { createChatRouter } from './modules/chat/chat.routes';

import { LoyaltyService } from './modules/loyalty/loyalty.service';
import { createLoyaltyRouter } from './modules/loyalty/loyalty.routes';

// Phase 3 modules
import { WarehouseService } from './modules/warehouse/warehouse.service';
import { createWarehouseRouter } from './modules/warehouse/warehouse.routes';

import { AdsService } from './modules/ads/ads.service';
import { createAdsRouter } from './modules/ads/ads.routes';

import { AffiliateService } from './modules/affiliate/affiliate.service';
import { createAffiliateRouter } from './modules/affiliate/affiliate.routes';

import { DisputeService } from './modules/dispute/dispute.service';
import { createDisputeRouter } from './modules/dispute/dispute.routes';

import { FraudService } from './modules/fraud/fraud.service';
import { createFraudRouter } from './modules/fraud/fraud.routes';

// Phase 4 modules
import { AiService } from './modules/ai/ai.service';
import { createAiRouter } from './modules/ai/ai.routes';

import { MarketingService } from './modules/marketing/marketing.service';
import { createMarketingRouter } from './modules/marketing/marketing.routes';

const prisma = new PrismaClient();
setEventPrisma(prisma);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5175',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth attempts' },
});
app.use('/api/v1/auth/', authLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Instantiate services
const authService = new AuthService(prisma);
const userService = new UserService(prisma);
const sellerService = new SellerService(prisma);
const catalogService = new CatalogService(prisma);
const inventoryService = new InventoryService(prisma);
const cartService = new CartService(prisma);
const promotionService = new PromotionService(prisma);
const orderService = new OrderService(prisma, inventoryService, promotionService);
const financeService = new FinanceService(prisma);
const reviewService = new ReviewService(prisma);
const adminService = new AdminService(prisma);
const searchService = new SearchService(prisma);
const returnRefundService = new ReturnRefundService(prisma);
const campaignService = new CampaignService(prisma);
const analyticsService = new AnalyticsService(prisma);
const loyaltyService = new LoyaltyService(prisma);
// Phase 3
const warehouseService = new WarehouseService(prisma);
const adsService = new AdsService(prisma);
const affiliateService = new AffiliateService(prisma);
const disputeService = new DisputeService(prisma);
const fraudService = new FraudService(prisma);
// Phase 4
const aiService = new AiService(prisma);
const marketingService = new MarketingService(prisma);

// Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, createAuthRouter(authService));
app.use(API_PREFIX, createUserRouter(userService));
app.use(API_PREFIX, createSellerRouter(sellerService));
app.use(API_PREFIX, createCatalogRouter(catalogService));
app.use(API_PREFIX, createCartRouter(cartService));
app.use(API_PREFIX, createOrderRouter(orderService));
app.use(API_PREFIX, createFinanceRouter(financeService));
app.use(API_PREFIX, createReviewRouter(reviewService));
app.use(API_PREFIX, createAdminRouter(adminService));
app.use(API_PREFIX, createSearchRouter(searchService));
app.use(API_PREFIX, createReturnRefundRouter(returnRefundService));
app.use(API_PREFIX, createCampaignRouter(campaignService));
app.use(API_PREFIX, createAnalyticsRouter(analyticsService));
app.use(API_PREFIX, createChatRouter());
app.use(API_PREFIX, createLoyaltyRouter(loyaltyService));
// Phase 3
app.use(API_PREFIX, createWarehouseRouter(warehouseService));
app.use(API_PREFIX, createAdsRouter(adsService));
app.use(API_PREFIX, createAffiliateRouter(affiliateService));
app.use(API_PREFIX, createDisputeRouter(disputeService));
app.use(API_PREFIX, createFraudRouter(fraudService));
// Phase 4
app.use(API_PREFIX, createAiRouter(aiService));
app.use(API_PREFIX, createMarketingRouter(marketingService));

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
