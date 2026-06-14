import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class QnAService {
  constructor(private prisma: PrismaClient) {}

  async getProductQnA(productId: string, params: { page?: number; limit?: number; unanswered?: boolean }) {
    const { skip, take } = getPaginationParams(params.page, params.limit);
    const where: any = { productId, isPublic: true };
    if (params.unanswered) where.answer = null;

    const [items, total] = await Promise.all([
      this.prisma.productQnA.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          asker: { select: { buyerProfile: { select: { fullName: true, avatar: true } } } },
          answerer: { select: { sellerProfile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.productQnA.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params.page, params.limit);
  }

  async askQuestion(userId: string, productId: string, question: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new AppError('Product not found', 404);

    return this.prisma.productQnA.create({
      data: {
        id: uuidv4(),
        productId,
        askerId: userId,
        question,
      },
      include: {
        asker: { select: { buyerProfile: { select: { fullName: true, avatar: true } } } },
      },
    });
  }

  async answerQuestion(userId: string, qnaId: string, answer: string) {
    const qna = await this.prisma.productQnA.findUnique({
      where: { id: qnaId },
      include: { product: { include: { shop: { include: { staffs: { select: { userId: true } } } } } } },
    });
    if (!qna) throw new AppError('Question not found', 404);

    const isOwner = qna.product.shop?.sellerProfile?.userId === userId;
    const isStaff = qna.product.shop?.staffs?.some((s: any) => s.userId === userId);
    if (!isOwner && !isStaff) throw new AppError('Only shop owner can answer', 403);

    return this.prisma.productQnA.update({
      where: { id: qnaId },
      data: { answer, answeredBy: userId, answeredAt: new Date() },
    });
  }

  async deleteQuestion(userId: string, qnaId: string, isAdmin = false) {
    const qna = await this.prisma.productQnA.findUnique({ where: { id: qnaId } });
    if (!qna) throw new AppError('Question not found', 404);
    if (!isAdmin && qna.askerId !== userId) throw new AppError('Permission denied', 403);

    await this.prisma.productQnA.delete({ where: { id: qnaId } });
    return { message: 'Question deleted' };
  }

  async getSellerQnA(shopId: string, params: { page?: number; limit?: number; answered?: boolean }) {
    const { skip, take } = getPaginationParams(params.page, params.limit);
    const where: any = { product: { shopId } };
    if (params.answered !== undefined) where.answer = params.answered ? { not: null } : null;

    const [items, total] = await Promise.all([
      this.prisma.productQnA.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, id: true } },
          asker: { select: { buyerProfile: { select: { fullName: true, avatar: true } } } },
        },
      }),
      this.prisma.productQnA.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params.page, params.limit);
  }
}
