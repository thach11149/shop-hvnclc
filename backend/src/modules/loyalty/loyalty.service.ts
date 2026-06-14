import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class LoyaltyService {
  constructor(private prisma: PrismaClient) {}

  async getAccount(userId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { id: uuidv4(), userId, points: 0, totalEarned: 0, totalSpent: 0 },
        include: { transactions: true },
      });
    }
    return account;
  }

  async getTransactions(userId: string, query: { page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) return buildPaginatedResult([], 0, page, limit);

    const where = { accountId: account.id };
    const [transactions, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loyaltyTransaction.count({ where }),
    ]);
    return buildPaginatedResult(transactions, total, page, limit);
  }

  async earnPoints(userId: string, data: {
    points: number;
    type?: 'EARN' | 'ADJUST';
    orderId?: string;
    note?: string;
  }) {
    const account = await this.getOrCreateAccount(userId);
    const newBalance = account.points + data.points;

    const [transaction, updated] = await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          id: uuidv4(),
          accountId: account.id,
          points: data.points,
          type: data.type ?? 'EARN',
          balanceAfter: newBalance,
          orderId: data.orderId,
          note: data.note ?? `Earned ${data.points} points`,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: data.points },
          totalEarned: { increment: data.points },
        },
      }),
    ]);

    return { transaction, account: updated };
  }

  async redeemPoints(userId: string, data: {
    points: number;
    orderId?: string;
    note?: string;
  }) {
    const account = await this.getOrCreateAccount(userId);
    if (account.points < data.points) {
      throw new AppError('Insufficient loyalty points', 400);
    }
    const newBalance = account.points - data.points;

    const [transaction, updated] = await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          id: uuidv4(),
          accountId: account.id,
          points: -data.points,
          type: 'SPEND',
          balanceAfter: newBalance,
          orderId: data.orderId,
          note: data.note ?? `Redeemed ${data.points} points`,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { decrement: data.points },
          totalSpent: { increment: data.points },
        },
      }),
    ]);

    return { transaction, account: updated };
  }

  async getTiers() {
    // No LoyaltyTier model in schema — return static tiers based on totalEarned
    return [
      { id: 'bronze', name: 'Đồng', minPoints: 0, discountRate: 0 },
      { id: 'silver', name: 'Bạc', minPoints: 1000, discountRate: 2 },
      { id: 'gold', name: 'Vàng', minPoints: 5000, discountRate: 5 },
      { id: 'platinum', name: 'Bạch kim', minPoints: 20000, discountRate: 10 },
    ];
  }

  async createTier(_data: { name: string; minPoints: number; discountRate: number; benefits?: string }) {
    // No LoyaltyTier model — return stub
    return { ..._data, id: uuidv4() };
  }

  async adminAdjustPoints(userId: string, points: number, reason: string) {
    return this.earnPoints(userId, { points, type: 'ADJUST', note: reason });
  }

  private async getOrCreateAccount(userId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { id: uuidv4(), userId, points: 0, totalEarned: 0, totalSpent: 0 },
      });
    }
    return account;
  }
}
