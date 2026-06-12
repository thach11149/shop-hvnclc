import { PrismaClient } from '@prisma/client';

export class AdsService {
  constructor(private prisma: PrismaClient) {}

  async listCampaigns(shopId: string) {
    return this.prisma.adCampaign.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCampaign(shopId: string, data: {
    name: string; type: string; dailyBudget: number; startDate: string;
  }) {
    return this.prisma.adCampaign.create({
      data: {
        shopId,
        name: data.name,
        type: data.type as any,
        dailyBudget: data.dailyBudget,
        startDate: new Date(data.startDate),
        status: 'PENDING_REVIEW',
        spent: 0,
        impressions: 0,
        clicks: 0,
        orders: 0,
      },
    });
  }

  async pauseCampaign(id: string, shopId: string) {
    return this.prisma.adCampaign.update({
      where: { id, shopId },
      data: { status: 'PAUSED' },
    });
  }

  async resumeCampaign(id: string, shopId: string) {
    return this.prisma.adCampaign.update({
      where: { id, shopId },
      data: { status: 'ACTIVE' },
    });
  }

  async getStats(shopId: string, _period: string) {
    const campaigns = await this.prisma.adCampaign.findMany({ where: { shopId } });
    const totalSpent = campaigns.reduce((s, c) => s + (c.spent ?? 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions ?? 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.clicks ?? 0), 0);
    const totalOrders = campaigns.reduce((s, c) => s + (c.orders ?? 0), 0);
    return {
      totalSpent,
      totalImpressions,
      totalClicks,
      totalOrders,
      roas: totalSpent > 0 ? (totalOrders * 100000) / totalSpent : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
      daily: [],
    };
  }

  async listAdminCampaigns() {
    return this.prisma.adCampaign.findMany({
      include: { shop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCampaign(id: string) {
    return this.prisma.adCampaign.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async rejectCampaign(id: string) {
    return this.prisma.adCampaign.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  async getAdminRevenue() {
    const all = await this.prisma.adCampaign.findMany();
    const totalRevenue = all.reduce((s, c) => s + (c.spent ?? 0), 0);
    const totalImpressions = all.reduce((s, c) => s + (c.impressions ?? 0), 0);
    const totalClicks = all.reduce((s, c) => s + (c.clicks ?? 0), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCampaigns = all.filter(c => c.createdAt >= monthStart);
    const monthRevenue = monthCampaigns.reduce((s, c) => s + (c.spent ?? 0), 0);
    return { totalRevenue, monthRevenue, totalImpressions, totalClicks };
  }

  async getKeywords() {
    return this.prisma.adKeyword.groupBy({
      by: ['keyword'],
      _count: { _all: true },
      _avg: { bidAmount: true },
      _sum: { impressions: true, clicks: true },
    }).then(rows => rows.map(r => ({
      keyword: r.keyword,
      campaignCount: r._count._all,
      avgBid: r._avg.bidAmount,
      impressions: r._sum.impressions,
      clicks: r._sum.clicks,
    })));
  }
}
