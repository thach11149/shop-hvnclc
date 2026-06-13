import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        buyerProfile: true,
        addresses: { orderBy: { isDefault: 'desc' } },
        loyaltyAccount: { select: { points: true, totalEarned: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId: string, data: Partial<{ fullName: string; avatar: string; birthDate: Date; gender: string }>) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) {
      return this.prisma.buyerProfile.create({ data: { id: uuidv4(), userId, ...data } });
    }
    return this.prisma.buyerProfile.update({ where: { userId }, data });
  }

  async getAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addAddress(userId: string, data: {
    fullName: string;
    phone: string;
    addressLine: string;
    ward?: string;
    district: string;
    province: string;
    country?: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.userAddress.create({ data: { id: uuidv4(), userId, ...data } });
  }

  async updateAddress(userId: string, addressId: string, data: Partial<{
    fullName: string;
    phone: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
    isDefault: boolean;
  }>) {
    const address = await this.prisma.userAddress.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new AppError('Address not found', 404);

    if (data.isDefault) {
      await this.prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.userAddress.update({ where: { id: addressId }, data });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new AppError('Address not found', 404);
    return this.prisma.userAddress.delete({ where: { id: addressId } });
  }

  async addWishlist(userId: string, productId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) return existing;
    return this.prisma.wishlistItem.create({ data: { id: uuidv4(), userId, productId } });
  }

  async removeWishlist(userId: string, productId: string) {
    return this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  }

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { images: { take: 1 }, skus: { take: 1, where: { isActive: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { notifications, unreadCount };
  }

  async markNotificationsRead(userId: string, notificationIds?: string[]) {
    const where = notificationIds ? { userId, id: { in: notificationIds } } : { userId };
    return this.prisma.notification.updateMany({ where, data: { isRead: true, readAt: new Date() } });
  }

  async followShop(userId: string, shopId: string) {
    const existing = await this.prisma.shopFollower.findUnique({
      where: { shopId_userId: { shopId, userId } },
    });
    if (existing) {
      await this.prisma.shopFollower.delete({ where: { shopId_userId: { shopId, userId } } });
      return { followed: false };
    }
    await this.prisma.shopFollower.create({ data: { shopId, userId } });
    return { followed: true };
  }

  async getFollowedShops(userId: string) {
    const follows = await this.prisma.shopFollower.findMany({
      where: { userId },
      include: {
        shop: {
          select: {
            id: true, name: true, slug: true, logoUrl: true, isActive: true,
            _count: { select: { followers: true, products: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(f => ({
      shopId: f.shopId,
      shopName: f.shop.name,
      shopSlug: f.shop.slug,
      logoUrl: f.shop.logoUrl,
      isActive: f.shop.isActive,
      followerCount: f.shop._count.followers,
      productCount: f.shop._count.products,
      followedAt: f.createdAt.toISOString(),
    }));
  }
}
