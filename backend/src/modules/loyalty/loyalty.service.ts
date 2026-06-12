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
        tier: true,
      },
    });
    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { id: uuidv4(), userId, points: 0, lifetimePoints: 0 },
        include: { transactions: true, tier: true },
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
    type: 'EARN_PURCHASE' | 'EARN_REVIEW' | 'EARN_REFERRAL' | 'EARN_BONUS' | 'ADMIN_ADJUST';
    referenceId?: string;
    description?: string;
  }) {
    const account = await this.getOrCreateAccount(userId);

    const [transaction, updated] = await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          id: uuidv4(),
          accountId: account.id,
          points: data.points,
          type: data.type,
          referenceId: data.referenceId,
          description: data.description || `Earned ${data.points} points`,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: data.points },
          lifetimePoints: { increment: data.points },
        },
      }),
    ]);

    await this.checkTierUpgrade(updated);
    return { transaction, account: updated };
  }

  async redeemPoints(userId: string, data: {
    points: number;
    referenceId?: string;
    description?: string;
  }) {
    const account = await this.getOrCreateAccount(userId);
    if (account.points < data.points) {
      throw new AppError('Insufficient loyalty points', 400);
    }

    const [transaction, updated] = await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          id: uuidv4(),
          accountId: account.id,
          points: -data.points,
          type: 'REDEEM_DISCOUNT',
          referenceId: data.referenceId,
          description: data.description || `Redeemed ${data.points} points`,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: { decrement: data.points } },
      }),
    ]);

    return { transaction, account: updated };
  }

  async getTiers() {
    return this.prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } });
  }

  async createTier(data: { name: string; minPoints: number; discountRate: number; benefits?: string }) {
    return this.prisma.loyaltyTier.create({
      data: { id: uuidv4(), ...data },
    });
  }

  async adminAdjustPoints(userId: string, points: number, reason: string) {
    return this.earnPoints(userId, {
      points,
      type: 'ADMIN_ADJUST',
      description: reason,
    });
  }

  private async getOrCreateAccount(userId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { id: uuidv4(), userId, points: 0, lifetimePoints: 0 },
      });
    }
    return account;
  }

  private async checkTierUpgrade(account: { id: string; lifetimePoints: number; tierId?: string | null }) {
    const tiers = await this.prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'desc' } });
    const newTier = tiers.find(t => account.lifetimePoints >= t.minPoints);
    if (newTier && newTier.id !== account.tierId) {
      await this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { tierId: newTier.id },
      });
    }
  }
}
