import { PrismaClient, LedgerType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class FinanceService {
  constructor(private prisma: PrismaClient) {}

  async createOrderLedgerEntry(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { include: { wallet: true } } },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (!order.shop.wallet) throw new AppError('Seller wallet not found', 404);

    const wallet = order.shop.wallet;
    const subtotal = order.subtotal.toNumber();
    const platformFee = order.platformFee.toNumber();
    const shippingFee = order.shippingFee.toNumber();
    const sellerReceivable = subtotal - platformFee;

    await this.prisma.$transaction([
      this.prisma.sellerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: sellerReceivable },
          pendingBalance: { decrement: sellerReceivable },
          totalReceived: { increment: sellerReceivable },
        },
      }),
      this.prisma.sellerLedgerEntry.create({
        data: {
          id: uuidv4(),
          walletId: wallet.id,
          orderId,
          type: LedgerType.ORDER_PAID,
          amount: sellerReceivable,
          balanceAfter: wallet.balance.toNumber() + sellerReceivable,
          note: `Order ${order.orderNumber} completed`,
        },
      }),
      this.prisma.sellerLedgerEntry.create({
        data: {
          id: uuidv4(),
          walletId: wallet.id,
          orderId,
          type: LedgerType.PLATFORM_FEE,
          amount: -platformFee,
          balanceAfter: wallet.balance.toNumber() + sellerReceivable - platformFee,
          note: `Platform fee for order ${order.orderNumber}`,
        },
      }),
    ]);

    await publishEvent({
      eventName: 'seller.ledger_created',
      entityId: wallet.id,
      entityType: 'seller_wallet',
      payload: { orderId, sellerReceivable, platformFee },
    });
  }

  async getSellerLedger(shopId: string, query: { page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const wallet = await this.prisma.sellerWallet.findUnique({ where: { shopId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const [entries, total] = await Promise.all([
      this.prisma.sellerLedgerEntry.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sellerLedgerEntry.count({ where: { walletId: wallet.id } }),
    ]);

    return { wallet, ...buildPaginatedResult(entries, total, page, limit) };
  }

  async getSellerFinanceSummary(shopId: string) {
    const wallet = await this.prisma.sellerWallet.findUnique({ where: { shopId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await this.prisma.order.aggregate({
      where: { shopId, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      wallet,
      last30Days: {
        revenue: recentOrders._sum.totalAmount || 0,
        ordersCount: recentOrders._count,
      },
    };
  }

  async requestWithdrawal(shopId: string, amount: number, bankAccountId?: string) {
    const wallet = await this.prisma.sellerWallet.findUnique({ where: { shopId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    if (wallet.balance.toNumber() < amount) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    const request = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.create({
        data: { id: uuidv4(), walletId: wallet.id, bankAccountId, amount },
      }),
      this.prisma.sellerWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
    ]);

    await publishEvent({
      eventName: 'withdrawal.requested',
      entityId: wallet.id,
      entityType: 'seller_wallet',
      payload: { amount },
      source: 'seller_center',
    });

    return request[0];
  }

  async getAdminFinanceSummary() {
    const [totalOrders, totalRevenue, totalSellers] = await Promise.all([
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true, platformFee: true },
      }),
      this.prisma.shop.count({ where: { status: 'APPROVED' } }),
    ]);

    return {
      totalCompletedOrders: totalOrders,
      totalGMV: totalRevenue._sum.totalAmount || 0,
      totalPlatformRevenue: totalRevenue._sum.platformFee || 0,
      totalActiveSellers: totalSellers,
    };
  }

  async getSalesReport(startDate: Date, endDate: Date) {
    return this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: true,
      _sum: { totalAmount: true },
    });
  }
}
