import { PrismaClient } from '@prisma/client';

export class DisputeService {
  constructor(private prisma: PrismaClient) {}

  async listByShop(shopId: string) {
    return this.prisma.dispute.findMany({
      where: { shopId },
      include: { buyer: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAdmin(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        buyer: { select: { fullName: true } },
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
        buyer: { select: { fullName: true } },
        shop: { select: { name: true } },
      },
    });
  }

  async sellerRespond(id: string, shopId: string, response: string) {
    return this.prisma.dispute.update({
      where: { id, shopId },
      data: {
        sellerResponse: response,
        status: 'UNDER_REVIEW',
        messages: {
          create: { sender: 'SELLER', content: response },
        },
      },
    });
  }

  async buyerMessage(id: string, buyerId: string, content: string) {
    const dispute = await this.prisma.dispute.findFirstOrThrow({ where: { id, buyerId } });
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
