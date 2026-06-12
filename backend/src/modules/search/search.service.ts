import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';
import { publishEvent } from '../../shared/events/event-publisher';

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  async search(query: {
    q: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }, userId?: string) {
    const { page, limit, skip } = getPaginationParams(query);

    const synonyms = await this.getSynonyms(query.q);
    const searchTerms = [query.q, ...synonyms];

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      OR: searchTerms.flatMap(term => [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
      ]),
    };

    if (query.categoryId) where['categoryId'] = query.categoryId;
    if (query.brand) where['brand'] = { contains: query.brand, mode: 'insensitive' };
    if (query.minPrice || query.maxPrice) {
      where['skus'] = {
        some: {
          isActive: true,
          price: {
            ...(query.minPrice && { gte: query.minPrice }),
            ...(query.maxPrice && { lte: query.maxPrice }),
          },
        },
      };
    }

    const orderBy = this.getSearchOrderBy(query.sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { take: 1 },
          skus: { where: { isActive: true }, take: 1 },
          shop: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Track search
    await this.trackSearch(query.q, userId);

    await publishEvent({
      eventName: 'search.performed',
      actorId: userId,
      actorType: userId ? 'user' : 'anonymous',
      payload: { keyword: query.q, resultsCount: total },
      source: 'buyer_web',
    });

    return buildPaginatedResult(products, total, page, limit);
  }

  async getSuggestions(q: string) {
    if (!q || q.length < 2) return [];

    const [keywordSuggestions, productSuggestions] = await Promise.all([
      this.prisma.searchKeyword.findMany({
        where: { keyword: { startsWith: q, mode: 'insensitive' }, isActive: true },
        orderBy: { count: 'desc' },
        take: 5,
        select: { keyword: true, count: true },
      }),
      this.prisma.product.findMany({
        where: { name: { startsWith: q, mode: 'insensitive' }, status: 'ACTIVE' },
        take: 5,
        select: { name: true, id: true },
      }),
    ]);

    return {
      keywords: keywordSuggestions.map(k => k.keyword),
      products: productSuggestions,
    };
  }

  async getSearchHistory(userId: string) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async clearSearchHistory(userId: string) {
    return this.prisma.searchHistory.deleteMany({ where: { userId } });
  }

  private async getSynonyms(keyword: string): Promise<string[]> {
    const synonyms = await this.prisma.searchSynonym.findMany({
      where: { keyword: { equals: keyword, mode: 'insensitive' } },
      select: { synonym: true },
    });
    return synonyms.map(s => s.synonym);
  }

  private async trackSearch(keyword: string, userId?: string) {
    await this.prisma.searchKeyword.upsert({
      where: { keyword },
      update: { count: { increment: 1 } },
      create: { id: uuidv4(), keyword, count: 1 },
    });

    if (userId) {
      await this.prisma.searchHistory.create({
        data: { id: uuidv4(), userId, keyword },
      });
    }
  }

  private getSearchOrderBy(sort?: string) {
    switch (sort) {
      case 'newest': return { createdAt: 'desc' as const };
      case 'popular': return { createdAt: 'desc' as const };
      default: return { createdAt: 'desc' as const };
    }
  }
}
