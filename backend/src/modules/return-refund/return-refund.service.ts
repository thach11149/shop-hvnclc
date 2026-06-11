import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class ReturnRefundService {
  constructor(private prisma: PrismaClient) {}

  async createReturnRequest(userId: string, orderId: string, data: {
    type: 'RETURN' | 'REFUND_ONLY' | 'EXCHANGE';
    reason: string;
    description?: string;
    items: { orderItemId: string; quantity: number; reason?: string }[];
    evidences?: { type: string; url: string }[];
  }) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'COMPLETED' },
      include: { items: true },
    });

    if (!order) throw new AppError('Order not found or not eligible for return', 400);

    const existing = await this.prisma.returnRequest.findFirst({
      where: { orderId, userId, status: { notIn: ['CANCELLED'] } },
    });
    if (existing) throw new AppError('Return request already exists for this order', 409);

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        id: uuidv4(),
        orderId,
        shopId: order.shopId,
        userId,
        type: data.type,
        reason: data.reason,
        description: data.description,
        items: {
          create: data.items.map(item => ({
            id: uuidv4(),
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason,
          })),
        },
        evidences: {
          create: (data.evidences || []).map(e => ({
            id: uuidv4(),
            uploaderId: userId,
            type: e.type,
            url: e.url,
          })),
        },
      },
      include: { items: true, evidences: true },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURN_REQUESTED' },
    });

    await publishEvent({
      eventName: 'return.requested',
      actorId: userId,
      actorType: 'user',
      entityId: returnRequest.id,
      entityType: 'return_request',
      payload: { orderId, type: data.type },
      source: 'buyer_web',
    });

    return returnRequest;
  }

  async sellerApproveReturn(returnId: string, shopId: string, note?: string) {
    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: { id: returnId, shopId, status: 'PENDING' },
    });
    if (!returnRequest) throw new AppError('Return request not found', 404);

    return this.prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'SELLER_APPROVED', sellerNote: note },
    });
  }

  async sellerRejectReturn(returnId: string, shopId: string, note: string) {
    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: { id: returnId, shopId, status: 'PENDING' },
    });
    if (!returnRequest) throw new AppError('Return request not found', 404);

    return this.prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'SELLER_REJECTED', sellerNote: note },
    });
  }

  async processRefund(returnId: string, adminId: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { order: true },
    });
    if (!returnRequest) throw new AppError('Return request not found', 404);

    const refundRequest = await this.prisma.refundRequest.create({
      data: {
        id: uuidv4(),
        returnId,
        amount: returnRequest.order.totalAmount,
        status: 'PROCESSING',
        processedBy: adminId,
      },
    });

    await this.prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'COMPLETED', resolvedAt: new Date(), resolvedBy: adminId },
    });

    await this.prisma.order.update({
      where: { id: returnRequest.orderId },
      data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
    });

    await publishEvent({
      eventName: 'refund.completed',
      entityId: refundRequest.id,
      entityType: 'refund_request',
      actorId: adminId,
      actorType: 'admin',
    });

    return refundRequest;
  }

  async getSellerReturnRequests(shopId: string, query: { status?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = { shopId, ...(query.status && { status: query.status as 'PENDING' | 'SELLER_APPROVED' | 'SELLER_REJECTED' | 'ADMIN_REVIEWING' | 'COMPLETED' | 'CANCELLED' }) };
    const [requests, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, evidences: true, order: { select: { orderNumber: true } } },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);
    return buildPaginatedResult(requests, total, page, limit);
  }

  async getAdminReturnRequests(query: { status?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = query.status ? { status: query.status as 'PENDING' | 'SELLER_APPROVED' | 'SELLER_REJECTED' | 'ADMIN_REVIEWING' | 'COMPLETED' | 'CANCELLED' } : {};
    const [requests, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { items: true, evidences: true, order: true, refundRequest: true },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);
    return buildPaginatedResult(requests, total, page, limit);
  }
}
