import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class AdsService {
  constructor(private prisma: PrismaClient) {}

  async listCampaigns(shopId: string) {
    return this.prisma.adsCampaign.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCampaign(shopId: string, data: {
    name: string; type: string; dailyBudget: number; startDate: string;
  }) {
    return this.prisma.adsCampaign.create({
      data: {
        id: uuidv4(),
        shopId,
        name: data.name,
        type: data.type as any,
        dailyBudget: data.dailyBudget,
        budget: data.dailyBudget * 30,
        startAt: new Date(data.startDate),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        spentAmount: 0,
      },
    });
  }

  async pauseCampaign(id: string, shopId: string) {
    return this.prisma.adsCampaign.update({
      where: { id, shopId },
      data: { status: 'PAUSED' },
    });
  }

  async resumeCampaign(id: string, shopId: string) {
    return this.prisma.adsCampaign.update({
      where: { id, shopId },
      data: { status: 'ACTIVE' },
    });
  }

  async toggleCampaign(id: string, shopId: string) {
    const campaign = await this.prisma.adsCampaign.findFirstOrThrow({ where: { id, shopId } });
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    return this.prisma.adsCampaign.update({ where: { id }, data: { status: newStatus } });
  }

  async updateCampaignBudget(id: string, shopId: string, dailyBudget: number) {
    return this.prisma.adsCampaign.update({
      where: { id, shopId },
      data: { dailyBudget, budget: dailyBudget * 30 },
    });
  }

  async getDetailedReports(shopId: string, _period: string) {
    const campaigns = await this.prisma.adsCampaign.findMany({
      where: { shopId },
      include: {
        spendLogs: true,
        adGroups: { include: { keywords: true } },
      },
    });

    const reportsByCampaign = campaigns.map(campaign => {
      const totalSpent = campaign.spentAmount.toNumber();
      const totalImpressions = campaign.spendLogs.reduce((s, l) => s + l.impressions, 0);
      const totalClicks = campaign.spendLogs.reduce((s, l) => s + l.clicks, 0);
      const roas = totalSpent > 0 ? (totalClicks * 100) / totalSpent : 0;
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        totalSpent,
        totalImpressions,
        totalClicks,
        roas,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
      };
    });

    const topByRoas = [...reportsByCampaign].sort((a, b) => b.roas - a.roas).slice(0, 10);

    return { campaigns: reportsByCampaign, topByRoas };
  }

  async getStats(shopId: string, _period: string) {
    const campaigns = await this.prisma.adsCampaign.findMany({ where: { shopId } });
    const totalSpent = campaigns.reduce((s, c) => s + c.spentAmount.toNumber(), 0);
    const spendLogs = await this.prisma.adsSpendLog.findMany({
      where: { campaign: { shopId } },
    });
    const totalImpressions = spendLogs.reduce((s, l) => s + l.impressions, 0);
    const totalClicks = spendLogs.reduce((s, l) => s + l.clicks, 0);
    return {
      totalSpent,
      totalImpressions,
      totalClicks,
      totalOrders: 0,
      roas: totalSpent > 0 ? (totalClicks * 100) / totalSpent : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
      daily: [],
    };
  }

  async listAdminCampaigns() {
    return this.prisma.adsCampaign.findMany({
      include: { shop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCampaign(id: string) {
    return this.prisma.adsCampaign.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async rejectCampaign(id: string) {
    return this.prisma.adsCampaign.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  async getAdminRevenue() {
    const all = await this.prisma.adsCampaign.findMany();
    const totalRevenue = all.reduce((s, c) => s + c.spentAmount.toNumber(), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCampaigns = all.filter(c => c.createdAt >= monthStart);
    const monthRevenue = monthCampaigns.reduce((s, c) => s + c.spentAmount.toNumber(), 0);
    return { totalRevenue, monthRevenue, totalImpressions: 0, totalClicks: 0 };
  }

  async getKeywords() {
    return this.prisma.adsKeyword.groupBy({
      by: ['keyword'],
      _count: { _all: true },
      _avg: { bidAmount: true },
    }).then(rows => rows.map(r => ({
      keyword: r.keyword,
      campaignCount: r._count._all,
      avgBid: r._avg.bidAmount,
      impressions: 0,
      clicks: 0,
    })));
  }
}
