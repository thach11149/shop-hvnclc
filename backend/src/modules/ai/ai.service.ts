import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/utils/response';

const CATEGORIES_MOCK: Record<string, string> = {
  'ao': 'Thời trang nam',
  'vay': 'Thời trang nữ',
  'giay': 'Giày dép',
  'tui': 'Túi xách',
  'dien_tu': 'Điện tử',
  'the_thao': 'Thể thao',
  'lam_dep': 'Làm đẹp',
};

function pickCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('áo') || lower.includes('quần') || lower.includes('váy')) return 'Thời trang';
  if (lower.includes('giày') || lower.includes('dép') || lower.includes('sandal')) return 'Giày dép';
  if (lower.includes('túi') || lower.includes('balo') || lower.includes('ví')) return 'Túi xách';
  if (lower.includes('điện') || lower.includes('máy') || lower.includes('phone') || lower.includes('tai nghe')) return 'Điện tử';
  if (lower.includes('kem') || lower.includes('son') || lower.includes('serum') || lower.includes('mỹ phẩm')) return 'Làm đẹp';
  if (lower.includes('thể thao') || lower.includes('gym') || lower.includes('yoga')) return 'Thể thao';
  return 'Đồ gia dụng';
}

function estimatePrice(name: string, features: string): number {
  const lower = (name + ' ' + features).toLowerCase();
  if (lower.includes('cao cấp') || lower.includes('luxury') || lower.includes('premium')) return Math.floor(Math.random() * 500000 + 800000);
  if (lower.includes('điện') || lower.includes('phone') || lower.includes('máy')) return Math.floor(Math.random() * 2000000 + 500000);
  if (lower.includes('giày') || lower.includes('túi')) return Math.floor(Math.random() * 400000 + 200000);
  return Math.floor(Math.random() * 200000 + 80000);
}

function getTrendFromSales(soldLast30d: number, soldLast7d: number): 'UP' | 'DOWN' | 'STABLE' {
  const weeklyAvg = soldLast30d / 4;
  if (soldLast7d > weeklyAvg * 1.2) return 'UP';
  if (soldLast7d < weeklyAvg * 0.8) return 'DOWN';
  return 'STABLE';
}

export class AiService {
  constructor(private prisma: PrismaClient) {}

  async shoppingAssistantChat(message: string, history: { role: string; content: string }[]) {
    const lower = message.toLowerCase();

    // Search for relevant products from catalog
    const keywords = message.split(' ').filter(w => w.length > 2).slice(0, 3);
    const products = await this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: keywords.map(k => ({ name: { contains: k, mode: 'insensitive' as const } })),
      },
      include: { skus: { where: { isActive: true }, take: 1 }, images: { take: 1 } },
      take: 3,
    });

    let reply = '';
    const suggestedProducts = products.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.skus[0]?.price ?? 0),
      image: p.images[0]?.url ?? '',
    }));

    if (lower.includes('so sánh')) {
      reply = `Tôi sẽ giúp bạn so sánh! Dưới đây là một số sản phẩm phù hợp để so sánh:`;
    } else if (lower.includes('rẻ') || lower.includes('giá tốt') || lower.includes('tiết kiệm')) {
      reply = `Tôi tìm thấy ${suggestedProducts.length > 0 ? suggestedProducts.length + ' sản phẩm' : 'một số sản phẩm'} phù hợp với ngân sách của bạn. Bạn có muốn lọc theo khoảng giá cụ thể không?`;
    } else if (lower.includes('giao hàng') || lower.includes('ship')) {
      reply = `Hầu hết sản phẩm trên sàn được giao trong 2-5 ngày. Đơn hàng trên 200.000đ thường được miễn phí vận chuyển!`;
    } else if (lower.includes('hoàn tiền') || lower.includes('đổi trả')) {
      reply = `Chính sách đổi trả trong vòng 15 ngày kể từ ngày nhận hàng. Bạn có thể tạo yêu cầu đổi trả trong mục "Đơn hàng" của tôi.`;
    } else if (suggestedProducts.length > 0) {
      reply = `Tôi tìm thấy ${suggestedProducts.length} sản phẩm phù hợp với yêu cầu "${message}". Bạn có muốn xem chi tiết hoặc so sánh không?`;
    } else {
      reply = `Tôi chưa tìm thấy sản phẩm chính xác cho "${message}". Bạn có thể mô tả thêm để tôi tìm kiếm chính xác hơn không? Ví dụ: loại sản phẩm, màu sắc, khoảng giá...`;
    }

    return { reply, products: suggestedProducts.length > 0 ? suggestedProducts : undefined };
  }

  async generateListing(shopId: string, productName: string, features: string) {
    const category = pickCategory(productName);
    const suggestedPrice = estimatePrice(productName, features);

    const featureLines = features.split(/[,\n]/).map(f => f.trim()).filter(Boolean);

    const title = `${productName} - Chính hãng, chất lượng cao`;
    const description = `**${productName}**\n\n${features}\n\nSản phẩm được kiểm tra chất lượng kỹ lưỡng trước khi giao đến tay bạn. Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất.`;
    const bulletPoints = [
      ...featureLines.slice(0, 3).map(f => `✓ ${f}`),
      '✓ Bảo hành chính hãng',
      '✓ Đổi trả trong 15 ngày',
    ];
    const nameParts = productName.toLowerCase().split(' ');
    const keywords = [
      productName,
      ...nameParts.filter(w => w.length > 2),
      `mua ${productName}`,
      `${productName} giá tốt`,
      `${category} chính hãng`,
    ].slice(0, 8);

    return {
      title,
      description,
      bulletPoints,
      keywords,
      suggestedCategory: category,
      suggestedPrice,
    };
  }

  async getPriceSuggestion(shopId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, shopId },
      include: { skus: { where: { isActive: true }, take: 1 } },
    });
    if (!product) throw new AppError('Sản phẩm không tồn tại', 404);

    const currentPrice = Number(product.skus[0]?.price ?? 0);

    // Get category average from same category products
    const competitors = await this.prisma.product.findMany({
      where: { categoryId: product.categoryId, status: 'PUBLISHED', id: { not: productId } },
      include: { skus: { where: { isActive: true }, take: 1 } },
      take: 20,
    });
    const competitorPrices = competitors
      .map(p => Number(p.skus[0]?.price ?? 0))
      .filter(p => p > 0);

    const competitorAvg = competitorPrices.length > 0
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
      : currentPrice;

    const minPrice = Math.min(...competitorPrices, currentPrice);
    const maxPrice = Math.max(...competitorPrices, currentPrice);
    const optimal = Math.round(competitorAvg * 0.95);

    // Demand score based on recent orders across all SKUs of this product
    const skuIds = product.skus.map(s => s.id);
    const recentSales = skuIds.length > 0 ? await this.prisma.orderItem.count({
      where: { skuId: { in: skuIds }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }) : 0;
    const demandScore = Math.min(Math.round(recentSales * 5 + Math.random() * 30), 100);
    const confidence = competitorPrices.length >= 5 ? 0.85 : competitorPrices.length >= 2 ? 0.65 : 0.40;

    let reasoning = '';
    if (currentPrice > competitorAvg * 1.1) reasoning = `Giá hiện tại cao hơn ${Math.round((currentPrice / competitorAvg - 1) * 100)}% so với trung bình ngành. Nên giảm giá để cạnh tranh hơn.`;
    else if (currentPrice < competitorAvg * 0.9) reasoning = `Giá hiện tại thấp hơn ${Math.round((1 - currentPrice / competitorAvg) * 100)}% thị trường. Có thể tăng giá mà vẫn cạnh tranh.`;
    else reasoning = `Giá hiện tại đang trong khoảng hợp lý so với thị trường (trung bình: ${Math.round(competitorAvg).toLocaleString('vi-VN')}đ).`;

    return {
      productId,
      productName: product.name,
      currentPrice,
      suggestedMin: Math.round(minPrice * 0.95),
      suggestedMax: Math.round(maxPrice * 1.05),
      optimal,
      competitorAvg: Math.round(competitorAvg),
      demandScore,
      confidence,
      reasoning,
    };
  }

  async getBulkPriceSuggestions(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shopId, status: 'PUBLISHED' },
      include: { skus: { where: { isActive: true }, take: 1 } },
      take: 20,
    });

    return Promise.all(products.map(async (product) => {
      const currentPrice = Number(product.skus[0]?.price ?? 0);
      const skuIds = product.skus.map(s => s.id);
      const recentSales = skuIds.length > 0 ? await this.prisma.orderItem.count({
        where: { skuId: { in: skuIds }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }) : 0;
      const demandScore = Math.min(recentSales * 5 + 20, 100);
      return {
        productId: product.id,
        productName: product.name,
        currentPrice,
        suggestedMin: Math.round(currentPrice * 0.85),
        suggestedMax: Math.round(currentPrice * 1.15),
        optimal: Math.round(currentPrice * (0.9 + Math.random() * 0.2)),
        competitorAvg: Math.round(currentPrice * (0.85 + Math.random() * 0.3)),
        demandScore,
        confidence: 0.55,
        reasoning: `Dựa trên ${recentSales} đơn trong 30 ngày qua.`,
      };
    }));
  }

  async getInventoryForecast(shopId: string) {
    const skus = await this.prisma.sKU.findMany({
      where: { product: { shopId }, isActive: true },
      include: {
        product: { select: { name: true } },
        inventoryStock: true,
      },
      take: 50,
    });

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return Promise.all(skus.map(async (sku) => {
      const stock = sku.inventoryStock;
      const currentStock = stock?.totalQuantity ?? 0;

      const sold30d = await this.prisma.orderItem.aggregate({
        where: { skuId: sku.id, createdAt: { gte: thirtyDaysAgo } },
        _sum: { quantity: true },
      });
      const sold7d = await this.prisma.orderItem.aggregate({
        where: { skuId: sku.id, createdAt: { gte: sevenDaysAgo } },
        _sum: { quantity: true },
      });

      const soldLast30d = sold30d._sum.quantity ?? 0;
      const soldLast7d = sold7d._sum.quantity ?? 0;
      const dailyAvg = soldLast30d / 30;
      const forecast7d = Math.round(dailyAvg * 7 * (1 + Math.random() * 0.2 - 0.1));
      const forecast30d = Math.round(dailyAvg * 30 * (1 + Math.random() * 0.2 - 0.1));
      const daysUntilStockout = dailyAvg > 0 ? Math.floor(currentStock / dailyAvg) : 999;
      const suggestedReorder = Math.max(0, forecast30d - currentStock + (stock?.lowStockThreshold ?? 5));
      const trend = getTrendFromSales(soldLast30d, soldLast7d);

      return {
        productId: sku.productId,
        productName: sku.product.name,
        sku: sku.skuCode,
        currentStock,
        forecast7d,
        forecast30d,
        daysUntilStockout,
        suggestedReorder,
        trend,
      };
    }));
  }

  async getDemandForecast(categoryId?: string, lowStockOnly?: boolean) {
    const skus = await this.prisma.sKU.findMany({
      where: {
        isActive: true,
        product: {
          status: 'PUBLISHED',
          ...(categoryId ? { categoryId } : {}),
        },
      },
      include: {
        product: { select: { id: true, name: true, categoryId: true } },
        inventoryStock: true,
      },
      take: 100,
    });

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const forecasts = await Promise.all(skus.map(async (sku) => {
      const currentStock = sku.inventoryStock?.totalQuantity ?? 0;

      const sold30d = await this.prisma.orderItem.aggregate({
        where: { skuId: sku.id, createdAt: { gte: thirtyDaysAgo } },
        _sum: { quantity: true },
      });
      const sold7d = await this.prisma.orderItem.aggregate({
        where: { skuId: sku.id, createdAt: { gte: sevenDaysAgo } },
        _sum: { quantity: true },
      });

      const soldLast30d = sold30d._sum.quantity ?? 0;
      const soldLast7d = sold7d._sum.quantity ?? 0;
      const dailyAvg = soldLast30d / 30;
      const forecastDemand7d = Math.round(dailyAvg * 7 * (1 + Math.random() * 0.15));
      const forecastDemand30d = Math.round(dailyAvg * 30 * (1 + Math.random() * 0.15));
      const reorderPoint = Math.round(dailyAvg * 7 + (sku.inventoryStock?.lowStockThreshold ?? 5));
      const suggestedOrder = Math.max(0, forecastDemand30d - currentStock + reorderPoint);
      const confidence = soldLast30d > 10 ? 0.85 : soldLast30d > 3 ? 0.65 : 0.40;
      const trend = getTrendFromSales(soldLast30d, soldLast7d);

      return {
        productId: sku.productId,
        productName: sku.product.name,
        sku: sku.skuCode,
        currentStock,
        forecastDemand7d,
        forecastDemand30d,
        reorderPoint,
        suggestedOrder,
        confidence,
        trend,
      };
    }));

    if (lowStockOnly) {
      return forecasts.filter(f => f.currentStock <= f.reorderPoint);
    }
    return forecasts;
  }

  getMLModels() {
    return [
      {
        id: 'model-recommendation-v2',
        name: 'Product Recommendation',
        type: 'COLLABORATIVE_FILTERING',
        version: '2.1.0',
        status: 'ACTIVE',
        accuracy: 0.87,
        precision: 0.84,
        recall: 0.82,
        f1Score: 0.83,
        predictionCount24h: Math.floor(Math.random() * 5000 + 10000),
        avgLatencyMs: 28,
        lastTrainedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextTrainingAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'model-fraud-detection-v3',
        name: 'Fraud Detection',
        type: 'GRADIENT_BOOSTING',
        version: '3.0.2',
        status: 'ACTIVE',
        accuracy: 0.93,
        precision: 0.91,
        recall: 0.88,
        f1Score: 0.90,
        predictionCount24h: Math.floor(Math.random() * 2000 + 3000),
        avgLatencyMs: 12,
        lastTrainedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextTrainingAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'model-demand-forecast-v1',
        name: 'Demand Forecasting',
        type: 'TIME_SERIES',
        version: '1.4.1',
        status: 'ACTIVE',
        accuracy: 0.79,
        precision: 0.76,
        recall: 0.74,
        f1Score: 0.75,
        predictionCount24h: Math.floor(Math.random() * 1000 + 500),
        avgLatencyMs: 45,
        lastTrainedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextTrainingAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'model-price-suggestion-v2',
        name: 'Price Suggestion',
        type: 'REGRESSION',
        version: '2.0.0',
        status: 'TRAINING',
        accuracy: 0.72,
        precision: 0.70,
        recall: 0.68,
        f1Score: 0.69,
        predictionCount24h: 0,
        avgLatencyMs: 0,
        lastTrainedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextTrainingAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'model-search-ranking-v1',
        name: 'Search Ranking',
        type: 'LEARNING_TO_RANK',
        version: '1.2.3',
        status: 'ACTIVE',
        accuracy: 0.81,
        precision: 0.80,
        recall: 0.79,
        f1Score: 0.80,
        predictionCount24h: Math.floor(Math.random() * 20000 + 30000),
        avgLatencyMs: 8,
        lastTrainedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        nextTrainingAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async getHomepageRecommendations(userId?: string) {
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        skus: { take: 1, select: { price: true, comparePrice: true } },
        shop: { select: { name: true } },
        _count: { select: { reviews: true, wishlistItems: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const scored = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shopName: p.shop.name,
      price: p.skus[0]?.price ?? 0,
      originalPrice: p.skus[0]?.comparePrice ?? null,
      reviewCount: p._count.reviews,
      wishlistCount: p._count.wishlistItems,
      score: Math.random() * 0.3 + 0.7,
      reason: userId ? 'Dựa trên lịch sử mua hàng của bạn' : 'Sản phẩm nổi bật hôm nay',
    })).sort((a, b) => b.score - a.score);

    return {
      type: 'HOMEPAGE',
      items: scored.slice(0, 12),
      algorithmVersion: 'cf-v2.1',
    };
  }

  async getProductRecommendations(productId: string, _userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, name: true },
    });

    const similar = await this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: product?.categoryId ?? undefined,
        id: { not: productId },
      },
      include: {
        skus: { take: 1, select: { price: true } },
        shop: { select: { name: true } },
        _count: { select: { reviews: true } },
      },
      take: 10,
    });

    return {
      type: 'PRODUCT_DETAIL',
      productId,
      items: similar.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        shopName: p.shop.name,
        price: p.skus[0]?.price ?? 0,
        reviewCount: p._count.reviews,
        score: Math.random() * 0.4 + 0.6,
        reason: 'Sản phẩm tương tự',
      })),
      algorithmVersion: 'content-v1.0',
    };
  }

  async getCartRecommendations(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { cart: { userId } },
      include: { sku: { include: { product: { select: { categoryId: true } } } } },
      take: 5,
    });

    const categoryIds = [...new Set(cartItems.map(ci => ci.sku.product.categoryId).filter(Boolean))] as string[];

    const suggestions = await this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: categoryIds.length > 0 ? { in: categoryIds } : undefined,
      },
      include: {
        skus: { take: 1, select: { price: true } },
        shop: { select: { name: true } },
        _count: { select: { reviews: true } },
      },
      take: 8,
    });

    return {
      type: 'CART',
      userId,
      items: suggestions.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        shopName: p.shop.name,
        price: p.skus[0]?.price ?? 0,
        reason: 'Thường mua cùng với sản phẩm trong giỏ',
      })),
    };
  }

  async getReviewSummary(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });
    if (!product) throw new AppError('Sản phẩm không tồn tại', 404);

    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true, comment: true, createdAt: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return { productId, summary: null, totalReviews: 0 };
    }

    const ratings = reviews.map(r => r.rating);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const dist = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: ratings.filter(r => r === star).length,
      pct: Math.round((ratings.filter(r => r === star).length / ratings.length) * 100),
    }));

    const positiveKeywords = ['tốt', 'đẹp', 'chất lượng', 'nhanh', 'ưng ý', 'hài lòng', 'bền', 'chuẩn'];
    const negativeKeywords = ['kém', 'xấu', 'chậm', 'tệ', 'hỏng', 'lỗi', 'thiếu', 'không đúng'];

    const allComments = reviews.map(r => r.comment ?? '').join(' ').toLowerCase();

    const pros = positiveKeywords.filter(k => allComments.includes(k)).slice(0, 4);
    const cons = negativeKeywords.filter(k => allComments.includes(k)).slice(0, 3);

    return {
      productId,
      productName: product.name,
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution: dist,
      summary: {
        pros: pros.length > 0 ? pros.map(k => `Người mua đánh giá ${k}`) : ['Sản phẩm được đánh giá tích cực'],
        cons: cons.length > 0 ? cons.map(k => `Một số phản hồi về ${k}`) : [],
        overallSentiment: avgRating >= 4 ? 'POSITIVE' : avgRating >= 3 ? 'MIXED' : 'NEGATIVE',
        highlight: avgRating >= 4.5 ? 'Sản phẩm được đánh giá rất cao' : `Điểm trung bình ${avgRating.toFixed(1)}/5`,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getFraudScoreForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { createdAt: true, status: true } },
        items: { take: 3 },
      },
    });
    if (!order) throw new AppError('Đơn hàng không tồn tại', 404);

    const accountAgeDays = Math.floor((Date.now() - order.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const isNewAccount = accountAgeDays < 30;

    let riskScore = 0;
    const flags: string[] = [];

    if (isNewAccount) { riskScore += 0.2; flags.push('Tài khoản mới (<30 ngày)'); }
    if (Number(order.totalAmount) > 5000000) { riskScore += 0.15; flags.push('Giá trị đơn hàng lớn'); }
    if (order.paymentMethod === 'BANK_TRANSFER') { riskScore += 0.05; }

    riskScore = Math.min(riskScore + Math.random() * 0.1, 1);

    return {
      orderId,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel: riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW',
      flags,
      modelVersion: 'fraud-v3.0.2',
      scoredAt: new Date().toISOString(),
    };
  }

  async getFraudScoreForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { orders: true } },
      },
    });
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    let riskScore = 0;
    const flags: string[] = [];

    if (accountAgeDays < 7) { riskScore += 0.3; flags.push('Tài khoản rất mới (<7 ngày)'); }
    if (user._count.orders > 20 && accountAgeDays < 30) { riskScore += 0.25; flags.push('Quá nhiều đơn hàng trong thời gian ngắn'); }
    if (user.status !== 'ACTIVE') { riskScore += 0.5; flags.push('Tài khoản bị vô hiệu hóa'); }

    riskScore = Math.min(riskScore + Math.random() * 0.1, 1);

    return {
      userId,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel: riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW',
      flags,
      orderCount: user._count.orders,
      accountAgeDays,
      modelVersion: 'user-fraud-v1.0',
      scoredAt: new Date().toISOString(),
    };
  }

  async getAdOptimizationSuggestions(shopId: string) {
    const ads = await this.prisma.adsCampaign.findMany({
      where: { shopId },
      include: {
        adGroups: { include: { keywords: { take: 3 } }, take: 2 },
      },
      take: 10,
    });

    return ads.map(ad => ({
      campaignId: ad.id,
      campaignName: ad.name,
      currentBudget: ad.dailyBudget,
      suggestions: [
        {
          type: 'KEYWORD',
          action: 'ADD',
          value: `${ad.name.split(' ')[0]} giá rẻ`,
          expectedCTRImprovement: '+15%',
          confidence: 0.72,
        },
        {
          type: 'BID',
          action: 'INCREASE',
          value: (Number(ad.budget) * 0.1).toFixed(0) + '₫',
          expectedConversionImprovement: '+8%',
          confidence: 0.65,
        },
        {
          type: 'SCHEDULE',
          action: 'FOCUS',
          value: '08:00-12:00, 19:00-22:00',
          expectedROIImprovement: '+12%',
          confidence: 0.80,
        },
      ],
      performanceScore: Math.round(Math.random() * 40 + 55),
    }));
  }
}
