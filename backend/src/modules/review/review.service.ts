import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class ReviewService {
  constructor(private prisma: PrismaClient) {}

  async createReview(userId: string, data: {
    productId: string;
    orderId: string;
    rating: number;
    comment?: string;
    images?: string[];
  }) {
    // Verify order exists and is completed
    const orderItem = await this.prisma.order.findFirst({
      where: {
        id: data.orderId,
        userId,
        status: 'COMPLETED',
        items: { some: { sku: { productId: data.productId } } },
      },
    });

    if (!orderItem) throw new AppError('Order not found or not completed', 400);

    const existing = await this.prisma.review.findFirst({
      where: { productId: data.productId, userId, orderId: data.orderId },
    });
    if (existing) throw new AppError('Review already submitted', 409);

    if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        productId: data.productId,
        userId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
        isVerified: true,
        images: {
          create: (data.images || []).map(url => ({ id: uuidv4(), url })),
        },
      },
      include: { images: true, user: { select: { buyerProfile: { select: { fullName: true, avatar: true } } } } },
    });

    await publishEvent({
      eventName: 'review.created',
      actorId: userId,
      actorType: 'user',
      entityId: review.id,
      entityType: 'review',
      payload: { productId: data.productId, rating: data.rating },
      source: 'buyer_web',
    });

    return review;
  }

  async getProductReviews(productId: string, query: { rating?: number; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = {
      productId,
      isHidden: false,
      ...(query.rating && { rating: query.rating }),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          user: { select: { id: true, buyerProfile: { select: { fullName: true, avatar: true } } } },
          _count: { select: { votes: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const stats = await this.prisma.review.aggregate({
      where: { productId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    });

    const ratingBreakdown = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isHidden: false },
      _count: true,
    });

    return {
      ...buildPaginatedResult(reviews, total, page, limit),
      averageRating: stats._avg.rating,
      totalReviews: stats._count,
      ratingBreakdown,
    };
  }

  async voteReview(reviewId: string, userId: string, isHelpful: boolean) {
    const existing = await this.prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });

    if (existing) {
      return this.prisma.reviewVote.update({ where: { id: existing.id }, data: { isHelpful } });
    }

    return this.prisma.reviewVote.create({
      data: { id: uuidv4(), reviewId, userId, isHelpful },
    });
  }

  async hideReview(reviewId: string, adminId: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: true },
    });
  }
}
