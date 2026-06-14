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

  async getAdminSummary(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalOrders, revenue, totalUsers, newUsers,
      totalSellers, activeSellers, pendingSellers,
      totalProducts, pendingProducts,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: since } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: { in: ['COMPLETED', 'DELIVERED', 'SHIPPING'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.shop.count(),
      this.prisma.shop.count({ where: { status: 'APPROVED' } }),
      this.prisma.shop.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);
    const [prevOrders, prevRevenue] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: prevSince, lt: since }, status: { in: ['COMPLETED', 'DELIVERED', 'SHIPPING'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    const currentRevenue = revenue._sum.totalAmount?.toNumber() || 0;
    const previousRevenue = prevRevenue._sum.totalAmount?.toNumber() || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : '0';

    return {
      period: days,
      revenue: currentRevenue,
      revenueGrowth: Number(revenueGrowth),
      orders: totalOrders,
      ordersGrowth: prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders * 100).toFixed(1) : '0',
      totalUsers, newUsers,
      totalSellers, activeSellers, pendingSellers,
      totalProducts, pendingProducts,
    };
  }

  async getOrderAnalytics(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since } },
      _count: true,
    });

    const dailyRevenue = await this.prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= ${since}
        AND status IN ('COMPLETED', 'DELIVERED', 'SHIPPING')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      ordersByStatus,
      dailyRevenue,
      period: days,
    };
  }

  async getFraudCasesSummary() {
    const [total, open, resolved] = await Promise.all([
      this.prisma.fraudCase.count(),
      this.prisma.fraudCase.count({ where: { status: 'open' } }),
      this.prisma.fraudCase.count({ where: { status: 'resolved' } }),
    ]);

    const bySeverity = await this.prisma.fraudCase.groupBy({
      by: ['severity'],
      _count: true,
    });

    return { total, open, resolved, bySeverity };
  }
}
