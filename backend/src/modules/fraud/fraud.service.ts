import { PrismaClient } from '@prisma/client';

export class FraudService {
  constructor(private prisma: PrismaClient) {}

  async listCases(status?: string) {
    return this.prisma.fraudCase.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateCaseStatus(id: string, status: string) {
    return this.prisma.fraudCase.update({
      where: { id },
      data: { status: status as any, updatedAt: new Date() },
    });
  }

  async getRiskScores(entityType: string, minScore: number) {
    return this.prisma.riskScore.findMany({
      where: {
        entityType: entityType as any,
        score: { gte: minScore },
      },
      orderBy: { score: 'desc' },
      take: 100,
    });
  }

  async listAIFraudAlerts(status?: string) {
    return this.prisma.aiFraudAlert.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  async updateAlertStatus(id: string, status: string) {
    return this.prisma.aiFraudAlert.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async computeRiskScore(entityType: string, entityId: string): Promise<number> {
    // Rule-based scoring placeholder - in production would call ML model
    let score = 0;
    if (entityType === 'USER') {
      const user = await this.prisma.user.findUnique({ where: { id: entityId } });
      if (!user) return 0;
      const recentOrders = await this.prisma.order.count({
        where: { buyerId: entityId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
      if (recentOrders > 20) score += 40;
      if (!user.phoneVerified) score += 20;
    }
    return Math.min(score, 100);
  }
}
