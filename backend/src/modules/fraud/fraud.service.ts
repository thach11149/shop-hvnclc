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
    return this.prisma.fraudCase.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  async updateAlertStatus(id: string, status: string) {
    return this.prisma.fraudCase.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async blockUserFromCase(caseId: string, adminId?: string) {
    const fraudCase = await this.prisma.fraudCase.findUniqueOrThrow({ where: { id: caseId } });
    const updated = await this.prisma.fraudCase.update({
      where: { id: caseId },
      data: { status: 'CONFIRMED' as any },
    });
    if (fraudCase.entityType === 'USER' && fraudCase.entityId) {
      try {
        await this.prisma.user.update({
          where: { id: fraudCase.entityId },
          data: { status: 'BANNED' },
        });
      } catch {}
    }
    return updated;
  }

  async computeRiskScore(entityType: string, entityId: string): Promise<number> {
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
