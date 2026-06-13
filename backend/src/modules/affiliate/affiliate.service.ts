import { PrismaClient } from '@prisma/client';

export class AffiliateService {
  constructor(private prisma: PrismaClient) {}

  async getMyStats(shopId: string) {
    // AffiliateLink belongs to a partner; clicks come via linkId
    // Simplified stats based on what the schema actually has
    const partner = await this.prisma.affiliatePartner.findFirst({
      where: { user: { sellerProfile: { shop: { id: shopId } } } },
      include: {
        commissions: { select: { amount: true, status: true } },
        _count: { select: { commissions: true } },
      },
    });

    const commissions = partner?.commissions ?? [];
    const totalOrders = commissions.length;
    const totalCommissionPaid = commissions
      .filter(c => c.status === 'APPROVED')
      .reduce((s, c) => s + c.amount.toNumber(), 0);

    return {
      totalClicks: 0,
      totalOrders,
      totalGmv: 0,
      totalCommissionPaid,
      publishers: [],
      topLinks: [],
    };
  }

  async listAdminPublishers() {
    return this.prisma.affiliatePartner.findMany({
      include: { _count: { select: { commissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePublisher(id: string) {
    return this.prisma.affiliatePartner.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async listAdminCommissions() {
    return this.prisma.affiliateCommission.findMany({
      include: { partner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPendingPayouts() {
    return this.prisma.affiliatePayout.findMany({
      where: { status: 'PENDING' },
      include: { partner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processPayout(id: string) {
    return this.prisma.affiliatePayout.update({ where: { id }, data: { status: 'COMPLETED', processedAt: new Date() } });
  }

  async generateReferralCode(userId: string) {
    const code = `REF${userId.slice(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.referralCode.upsert({
      where: { userId },
      create: { userId, code },
      update: {},
    });
  }

  async getMyReferral(userId: string) {
    const ref = await this.prisma.referralCode.findUnique({
      where: { userId },
      include: {
        invites: { include: { invitee: true } },
      },
    });
    if (!ref) return null;
    return {
      code: ref.code,
      link: `${process.env.FRONTEND_URL || 'https://app.example.com'}?ref=${ref.code}`,
      totalInvited: ref.invites.length,
      totalQualified: ref.invites.filter((r: any) => r.rewardGiven).length,
      totalRewardEarned: 0,
      pendingReward: 0,
      history: ref.invites.map((r: any) => ({
        friendName: r.invitee?.fullName ?? 'N/A',
        status: r.rewardGiven ? 'QUALIFIED' : 'PENDING',
        rewardAmount: 0,
        joinedAt: r.createdAt,
      })),
    };
  }
}
