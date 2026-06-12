import { PrismaClient } from '@prisma/client';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';
import { AppError } from '../../shared/utils/response';
import { publishAuditLog } from '../../shared/events/event-publisher';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  async getDashboard() {
    const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalSellers, totalOrders, revenue, todayOrders, pendingSellersList, pendingProductsList, monthRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.shop.count({ where: { status: 'APPROVED' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
      this.prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      this.prisma.sellerProfile.findMany({
        where: { shop: { status: 'PENDING_APPROVAL' } },
        include: { user: { select: { email: true } }, shop: { select: { name: true } } },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: { shop: { select: { name: true } } },
        take: 5,
      }),
      this.prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: since30Days } }, _sum: { totalAmount: true } }),
    ]);

    return {
      totalUsers,
      totalSellers,
      totalOrders,
      todayOrders,
      totalGMV: revenue._sum.totalAmount || 0,
      monthRevenue: monthRevenue._sum.totalAmount || 0,
      pendingSellers: pendingSellersList,
      pendingProducts: pendingProductsList,
    };
  }

  async getUsers(query: { status?: string; role?: string; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;
    if (query.role) where['role'] = query.role;
    if (query.search) {
      where['OR'] = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, phone: true, role: true, status: true, createdAt: true, lastLoginAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, total, page, limit);
  }

  async updateUserStatus(userId: string, status: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED' },
    });

    await publishAuditLog({
      actorId: adminId,
      actorType: 'admin',
      action: 'update_user_status',
      entityType: 'user',
      entityId: userId,
      oldValue: { status: user.status },
      newValue: { status },
    });

    return updated;
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { position: 'asc' },
    });
  }

  async getBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createBanner(data: {
    title?: string;
    imageUrl: string;
    link?: string;
    position?: string;
    sortOrder?: number;
    startAt?: Date;
    endAt?: Date;
  }) {
    const { v4: uuidv4 } = require('uuid');
    return this.prisma.banner.create({ data: { id: uuidv4(), ...data } });
  }

  async updateBanner(id: string, data: Partial<{ title: string; imageUrl: string; link: string; isActive: boolean; sortOrder: number }>) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async deleteBanner(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }

  async getWithdrawalRequests(query: { status?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = query.status ? { status: query.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' } : {};
    const [requests, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { wallet: { include: { shop: { select: { name: true } } } } },
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);
    return buildPaginatedResult(requests, total, page, limit);
  }

  async processWithdrawal(id: string, status: string, adminId: string, note?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) throw new AppError('Withdrawal request not found', 404);

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED',
        processedAt: new Date(),
        processedBy: adminId,
        note,
      },
    });

    if (status === 'REJECTED') {
      // Return funds to wallet
      await this.prisma.sellerWallet.update({
        where: { id: request.walletId },
        data: { balance: { increment: request.amount } },
      });
    } else if (status === 'COMPLETED') {
      await this.prisma.sellerWallet.update({
        where: { id: request.walletId },
        data: { totalWithdrawn: { increment: request.amount } },
      });
    }

    await publishAuditLog({ actorId: adminId, actorType: 'admin', action: 'process_withdrawal', entityType: 'withdrawal_request', entityId: id, newValue: { status } });
    return updated;
  }
}
