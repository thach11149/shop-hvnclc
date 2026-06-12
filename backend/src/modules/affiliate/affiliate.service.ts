import { PrismaClient } from '@prisma/client';

export class AffiliateService {
  constructor(private prisma: PrismaClient) {}

  async getMyStats(shopId: string) {
    const commissions = await this.prisma.affiliateCommission.findMany({
      where: { shopId },
      include: { publisher: true },
    });
    const totalClicks = await this.prisma.affiliateClick.count({ where: { shopId } });
    const totalOrders = commissions.length;
    const totalGmv = commissions.reduce((s, c) => s + c.orderValue, 0);
    const totalCommissionPaid = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.commission, 0);
    const publisherMap = new Map<string, any>();
    for (const c of commissions) {
      const key = c.publisherId;
      if (!publisherMap.has(key)) publisherMap.set(key, { id: key, name: c.publisher?.name, clicks: 0, orders: 0, gmv: 0 });
      const p = publisherMap.get(key);
      p.orders++;
      p.gmv += c.orderValue;
    }
    return {
      totalClicks, totalOrders, totalGmv, totalCommissionPaid,
      publishers: [...publisherMap.values()],
      topLinks: [],
    };
  }

  async listAdminPublishers() {
    return this.prisma.affiliatePublisher.findMany({
      include: { _count: { select: { commissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePublisher(id: string) {
    return this.prisma.affiliatePublisher.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async listAdminCommissions() {
    return this.prisma.affiliateCommission.findMany({
      include: { publisher: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPendingPayouts() {
    return this.prisma.affiliatePayout.findMany({
      where: { status: 'PENDING' },
      include: { publisher: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processPayout(id: string) {
    return this.prisma.affiliatePayout.update({ where: { id }, data: { status: 'PROCESSED', processedAt: new Date() } });
  }

  async generateReferralCode(userId: string) {
    const code = `REF${userId.slice(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    const link = `${process.env.FRONTEND_URL || 'https://app.example.com'}?ref=${code}`;
    return this.prisma.referralCode.upsert({
      where: { userId },
      create: { userId, code, link },
      update: {},
    });
  }

  async getMyReferral(userId: string) {
    const ref = await this.prisma.referralCode.findUnique({
      where: { userId },
      include: {
        referrals: { include: { referred: true } },
      },
    });
    if (!ref) return null;
    return {
      code: ref.code,
      link: ref.link,
      totalInvited: ref.referrals.length,
      totalQualified: ref.referrals.filter((r: any) => r.status === 'QUALIFIED').length,
      totalRewardEarned: ref.referrals.filter((r: any) => r.status === 'QUALIFIED').reduce((s: number, r: any) => s + r.rewardAmount, 0),
      pendingReward: ref.referrals.filter((r: any) => r.status === 'PENDING').reduce((s: number, r: any) => s + r.rewardAmount, 0),
      history: ref.referrals.map((r: any) => ({
        friendName: r.referred?.fullName ?? 'N/A',
        status: r.status,
        rewardAmount: r.rewardAmount,
        joinedAt: r.createdAt,
      })),
    };
  }
}
