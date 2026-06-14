import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class LiveStreamService {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, data: { title: string; description?: string; scheduledAt?: string; products?: string[] }) {
    const shop = await this.prisma.shop.findFirst({
      where: { sellerProfile: { userId } },
      select: { id: true },
    });
    if (!shop) throw new AppError('Shop not found', 404);

    return this.prisma.liveStream.create({
      data: {
        id: uuidv4(),
        shopId: shop.id,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        products: data.products || [],
      },
    });
  }

  async getShopStreams(userId: string, params: { page?: number; limit?: number; status?: string }) {
    const shop = await this.prisma.shop.findFirst({
      where: { sellerProfile: { userId } },
      select: { id: true },
    });
    if (!shop) return buildPaginatedResult([], 0, params.page, params.limit);

    const { skip, take } = getPaginationParams(params.page, params.limit);
    const where: any = { shopId: shop.id };
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.liveStream.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.liveStream.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params.page, params.limit);
  }

  async updateStatus(userId: string, streamId: string, status: 'LIVE' | 'ENDED') {
    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: { shop: { include: { sellerProfile: true } } },
    });
    if (!stream) throw new AppError('Stream not found', 404);
    if (stream.shop.sellerProfile?.userId !== userId) throw new AppError('Permission denied', 403);

    return this.prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status,
        startedAt: status === 'LIVE' ? new Date() : undefined,
        endedAt: status === 'ENDED' ? new Date() : undefined,
      },
    });
  }

  async getLiveStreams(params: { page?: number; limit?: number }) {
    const { skip, take } = getPaginationParams(params.page, params.limit);
    const where = { status: 'LIVE' };

    const [items, total] = await Promise.all([
      this.prisma.liveStream.findMany({
        where,
        skip,
        take,
        orderBy: { viewerCount: 'desc' },
        include: { shop: { select: { name: true, logo: true, slug: true } } },
      }),
      this.prisma.liveStream.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params.page, params.limit);
  }
}
