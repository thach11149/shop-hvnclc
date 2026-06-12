import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async trackEvent(data: {
    userId?: string;
    sessionId?: string;
    deviceId?: string;
    eventType: string;
    productId?: string;
    categoryId?: string;
    keyword?: string;
    campaignId?: string;
    metadata?: object;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { userId, productId, ...rest } = data;
    return this.prisma.behaviorEvent.create({
      data: {
        id: uuidv4(),
        ...rest,
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        ...(productId ? { product: { connect: { id: productId } } } : {}),
      },
    });
  }

  async batchTrackEvents(events: Parameters<AnalyticsService['trackEvent']>[0][]) {
    return this.prisma.behaviorEvent.createMany({
      data: events.map(e => ({
        id: uuidv4(),
        eventType: e.eventType,
        userId: e.userId,
        sessionId: e.sessionId,
        deviceId: e.deviceId,
        productId: e.productId,
        categoryId: e.categoryId,
        keyword: e.keyword,
        campaignId: e.campaignId,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
      })),
    });
  }

  async getProductBehaviorStats(productId: string) {
    const [views, addToCarts, purchases] = await Promise.all([
      this.prisma.behaviorEvent.count({ where: { productId, eventType: 'product_viewed' } }),
      this.prisma.behaviorEvent.count({ where: { productId, eventType: 'add_to_cart' } }),
      this.prisma.behaviorEvent.count({ where: { productId, eventType: 'purchase' } }),
    ]);

    return {
      views,
      addToCarts,
      purchases,
      conversionRate: views > 0 ? ((purchases / views) * 100).toFixed(2) : 0,
    };
  }
}
