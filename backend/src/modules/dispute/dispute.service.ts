import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/utils/response';

export class DisputeService {
  constructor(private prisma: PrismaClient) {}

  async createDispute(orderId: string, userId: string, data: { reason: string; description?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, shopId: true, status: true },
    });
    if (!order) throw new AppError('Đơn hàng không tồn tại', 404);
    if (order.userId !== userId) throw new AppError('Không có quyền', 403);

    const existing = await this.prisma.dispute.findFirst({ where: { orderId } });
    if (existing) throw new AppError('Tranh chấp đã tồn tại cho đơn hàng này', 409);

    return this.prisma.dispute.create({
      data: {
        orderId,
        shopId: order.shopId,
        openedBy: userId,
        reason: data.reason,
        description: data.description,
        status: 'OPEN',
        messages: {
          create: [{ sender: 'BUYER', content: `[${data.reason}] ${data.description ?? ''}` }],
        },
      },
    });
  }

  async listByShop(shopId: string) {
    return this.prisma.dispute.findMany({
      where: { shopId },
      include: {
        order: { select: { orderNumber: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByBuyer(userId: string) {
    return this.prisma.dispute.findMany({
      where: { openedBy: userId },
      include: {
        order: { select: { orderNumber: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAdmin(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        order: { select: { orderNumber: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return this.prisma.dispute.findUniqueOrThrow({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        evidences: true,
        order: { select: { orderNumber: true, totalAmount: true } },
        shop: { select: { name: true } },
      },
    });
  }

  async sellerRespond(id: string, shopId: string, response: string) {
    const dispute = await this.prisma.dispute.findFirst({ where: { id, shopId } });
    if (!dispute) throw new AppError('Tranh chấp không tồn tại', 404);
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW' as any,
        messages: {
          create: { sender: 'SELLER', content: response },
        },
      },
    });
  }

  async buyerMessage(id: string, userId: string, content: string) {
    const dispute = await this.prisma.dispute.findFirstOrThrow({ where: { id, openedBy: userId } });
    return this.prisma.disputeMessage.create({
      data: { disputeId: dispute.id, sender: 'BUYER', content },
    });
  }

  async resolve(id: string, resolution: string, favor: string) {
    const status = favor === 'buyer' ? 'RESOLVED_BUYER' : 'RESOLVED_SELLER';
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: status as any,
        resolution,
        resolvedAt: new Date(),
        messages: {
          create: { sender: 'ADMIN', content: `Kết luận: ${resolution}` },
        },
      },
    });
  }
}
