import { PrismaClient, DiscountType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';

export interface CartItemForPromo {
  skuId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shopId: string;
}

export interface PromoResult {
  promotionId: string;
  discountAmount: number;
  type: string;
}

export class PromotionService {
  constructor(private prisma: PrismaClient) {}

  async validateVoucher(code: string, userId: string, cartItems: CartItemForPromo[], subtotal: number): Promise<PromoResult> {
    const promo = await this.prisma.promotion.findUnique({
      where: { code },
      include: { rules: true, targets: true },
    });

    if (!promo || !promo.isActive) throw new AppError('Voucher not found or inactive', 404);

    const now = new Date();
    if (now < promo.startAt || now > promo.endAt) throw new AppError('Voucher expired', 400);

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new AppError('Voucher usage limit reached', 400);
    }

    if (promo.usageLimitPerUser) {
      const userUsage = await this.prisma.promotionRedemption.count({
        where: { promotionId: promo.id, userId },
      });
      if (userUsage >= promo.usageLimitPerUser) {
        throw new AppError('You have reached the usage limit for this voucher', 400);
      }
    }

    if (promo.minOrderAmount && subtotal < promo.minOrderAmount.toNumber()) {
      throw new AppError(`Minimum order amount is ${promo.minOrderAmount}`, 400);
    }

    let discountAmount = this.calculateDiscount(promo, subtotal);

    await publishEvent({
      eventName: 'promotion.applied',
      actorId: userId,
      actorType: 'user',
      entityId: promo.id,
      entityType: 'promotion',
      payload: { code, discountAmount },
      source: 'buyer_web',
    });

    return { promotionId: promo.id, discountAmount, type: promo.type };
  }

  async redeemVoucher(promotionId: string, orderId: string, userId: string, discountAmount: number) {
    await this.prisma.$transaction([
      this.prisma.promotionRedemption.create({
        data: {
          id: uuidv4(),
          promotionId,
          orderId,
          userId,
          discountAmount,
        },
      }),
      this.prisma.promotion.update({
        where: { id: promotionId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    await publishEvent({
      eventName: 'promotion.redeemed',
      actorId: userId,
      actorType: 'user',
      entityId: promotionId,
      entityType: 'promotion',
      payload: { orderId, discountAmount },
    });
  }

  async createPromotion(data: {
    shopId?: string;
    type: string;
    code?: string;
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    startAt: Date;
    endAt: Date;
  }, createdBy: string) {
    return this.prisma.promotion.create({
      data: {
        id: uuidv4(),
        ...data,
        type: data.type as Parameters<typeof this.prisma.promotion.create>[0]['data']['type'],
        discountType: data.discountType as DiscountType,
        createdBy,
      },
    });
  }

  async getPromotions(shopId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = shopId ? { shopId } : { shopId: null };
    return this.prisma.promotion.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateDiscount(
    promo: { discountType: string; discountValue: { toNumber: () => number }; maxDiscount: { toNumber: () => number } | null },
    subtotal: number
  ): number {
    if (promo.discountType === DiscountType.PERCENTAGE) {
      const discount = (subtotal * promo.discountValue.toNumber()) / 100;
      return promo.maxDiscount ? Math.min(discount, promo.maxDiscount.toNumber()) : discount;
    }
    if (promo.discountType === DiscountType.FIXED_AMOUNT) {
      return Math.min(promo.discountValue.toNumber(), subtotal);
    }
    return 0;
  }
}
