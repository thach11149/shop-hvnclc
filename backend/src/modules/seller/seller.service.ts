import { PrismaClient, UserRole, ShopStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent, publishAuditLog } from '../../shared/events/event-publisher';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class SellerService {
  constructor(private prisma: PrismaClient) {}

  async registerSeller(userId: string, data: {
    fullName: string;
    shopName: string;
    shopDescription?: string;
    phone?: string;
    email?: string;
    addressLine?: string;
    province?: string;
    idNumber?: string;
  }) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (existing) throw new AppError('Seller profile already exists', 409);

    const shopSlug = this.generateSlug(data.shopName) + '-' + uuidv4().slice(0, 6);

    const [profile] = await this.prisma.$transaction([
      this.prisma.sellerProfile.create({
        data: {
          id: uuidv4(),
          userId,
          fullName: data.fullName,
          idNumber: data.idNumber,
          shop: {
            create: {
              id: uuidv4(),
              name: data.shopName,
              slug: shopSlug,
              description: data.shopDescription,
              phone: data.phone,
              email: data.email,
              addressLine: data.addressLine,
              province: data.province,
              status: ShopStatus.PENDING_APPROVAL,
            },
          },
        },
        include: { shop: true },
      }),
      this.prisma.user.update({ where: { id: userId }, data: { role: UserRole.SELLER_OWNER } }),
    ]);

    // Create seller wallet
    if (profile.shop) {
      await this.prisma.sellerWallet.create({
        data: { id: uuidv4(), shopId: profile.shop.id },
      });
    }

    await publishEvent({
      eventName: 'seller.registered',
      actorId: userId,
      actorType: 'user',
      entityId: profile.id,
      entityType: 'seller_profile',
      source: 'seller_center',
    });

    return profile;
  }

  async getShop(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        sellerProfile: { include: { user: { select: { email: true } } } },
        wallet: true,
        bankAccounts: true,
      },
    });
    if (!shop) throw new AppError('Shop not found', 404);
    return shop;
  }

  async updateShop(shopId: string, data: Partial<{
    name: string;
    description: string;
    phone: string;
    email: string;
    addressLine: string;
    province: string;
    logo: string;
    banner: string;
  }>) {
    return this.prisma.shop.update({ where: { id: shopId }, data });
  }

  async getSellerProfile(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { shop: { include: { wallet: true } } },
    });
    if (!profile) throw new AppError('Seller profile not found', 404);
    return profile;
  }

  // ADMIN
  async getAdminSellers(query: { status?: ShopStatus; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = query.status ? { status: query.status } : {};
    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { sellerProfile: { include: { user: { select: { email: true } } } } },
      }),
      this.prisma.shop.count({ where }),
    ]);
    return buildPaginatedResult(shops, total, page, limit);
  }

  async approveSeller(shopId: string, adminId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new AppError('Shop not found', 404);
    if (shop.status !== ShopStatus.PENDING_APPROVAL) throw new AppError('Shop is not pending approval', 400);

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { status: ShopStatus.APPROVED, approvedAt: new Date(), approvedBy: adminId },
    });

    await publishEvent({ eventName: 'seller.approved', entityId: shopId, entityType: 'shop', actorId: adminId, actorType: 'admin' });
    await publishAuditLog({ actorId: adminId, actorType: 'admin', action: 'approve_seller', entityType: 'shop', entityId: shopId });

    return updated;
  }

  async rejectSeller(shopId: string, adminId: string, reason: string) {
    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { status: ShopStatus.REJECTED, rejectionReason: reason },
    });

    await publishEvent({ eventName: 'seller.rejected', entityId: shopId, entityType: 'shop', actorId: adminId, actorType: 'admin', payload: { reason } });
    await publishAuditLog({ actorId: adminId, actorType: 'admin', action: 'reject_seller', entityType: 'shop', entityId: shopId, newValue: { reason } });

    return updated;
  }

  async getShopByUserId(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { shop: true },
    });
    return profile?.shop;
  }

  private generateSlug(name: string) {
    return name.toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
