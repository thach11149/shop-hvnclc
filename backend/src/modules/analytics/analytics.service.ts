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

  async getTopSellers(days: number, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const groups = await this.prisma.order.groupBy({
      by: ['shopId'],
      where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: since } },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });
    const shopIds = groups.map(g => g.shopId);
    const shops = await this.prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: { id: true, name: true, slug: true },
    });
    const cancelCounts = await this.prisma.order.groupBy({
      by: ['shopId'],
      where: { shopId: { in: shopIds }, status: 'CANCELLED', createdAt: { gte: since } },
      _count: true,
    });
    const cancelMap = Object.fromEntries(cancelCounts.map(c => [c.shopId, c._count]));
    return groups.map(g => {
      const shop = shops.find(s => s.id === g.shopId);
      const totalOrders = g._count + (cancelMap[g.shopId] || 0);
      const completionRate = totalOrders > 0 ? ((g._count / totalOrders) * 100).toFixed(1) : '100';
      return {
        shopId: g.shopId,
        shopName: shop?.name || 'Unknown',
        shopSlug: shop?.slug,
        gmv: Number(g._sum?.totalAmount || 0),
        ordersCount: g._count,
        completionRate: Number(completionRate),
      };
    });
  }

  async getTopCategories(days: number, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: since } } },
      _sum: { subtotal: true, quantity: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 100,
    });
    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true },
    });
    const catMap: Record<string, { revenue: number; orders: number }> = {};
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product?.categoryId) return;
      if (!catMap[product.categoryId]) catMap[product.categoryId] = { revenue: 0, orders: 0 };
      catMap[product.categoryId].revenue += Number(item._sum?.subtotal || 0);
      catMap[product.categoryId].orders += item._sum?.quantity || 0;
    });
    const catIds = Object.keys(catMap);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: catIds } },
      select: { id: true, name: true },
    });
    return categories
      .map(cat => ({ ...catMap[cat.id], categoryId: cat.id, categoryName: cat.name }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getRealtimeMetrics() {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const [processingOrders, openDisputes, pendingSellers] = await Promise.all([
      this.prisma.order.count({ where: { status: { in: ['AWAITING_SELLER_CONFIRM', 'SELLER_CONFIRMED', 'PACKED', 'SHIPPING'] } } }),
      this.prisma.dispute.count({ where: { status: { in: ['open', 'under_review'] } } }),
      this.prisma.shop.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);
    return { processingOrders, openDisputes, pendingSellers, timestamp: now };
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
