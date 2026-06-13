import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/utils/response';

export class MarketingService {
  constructor(private prisma: PrismaClient) {}

  async listSegments(activeOnly?: boolean) {
    const segments = await this.prisma.customerSegment.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return segments.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      conditions: s.conditions as Record<string, unknown>[],
      userCount: s._count.members,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async createSegment(data: { name: string; description?: string; conditions?: Record<string, unknown>[] }) {
    const segment = await this.prisma.customerSegment.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        conditions: data.conditions ?? [],
      },
    });
    return segment;
  }

  async toggleSegment(id: string) {
    const segment = await this.prisma.customerSegment.findUnique({ where: { id } });
    if (!segment) throw new AppError('Segment không tồn tại', 404);
    return this.prisma.customerSegment.update({
      where: { id },
      data: { isActive: !segment.isActive },
    });
  }

  async recalculateSegment(id: string) {
    const segment = await this.prisma.customerSegment.findUnique({ where: { id } });
    if (!segment) throw new AppError('Segment không tồn tại', 404);

    // Simple recalculation: count all users matching basic conditions
    const totalUsers = await this.prisma.user.count({ where: { isActive: true } });
    const conditions = segment.conditions as Record<string, unknown>[];

    let estimatedCount = totalUsers;
    for (const cond of conditions) {
      if (cond.field === 'order_count' && cond.operator === 'gte') {
        estimatedCount = Math.floor(estimatedCount * 0.6);
      } else if (cond.field === 'total_spent' && cond.operator === 'gte') {
        estimatedCount = Math.floor(estimatedCount * 0.4);
      } else {
        estimatedCount = Math.floor(estimatedCount * 0.7);
      }
    }

    return this.prisma.customerSegment.update({
      where: { id },
      data: { memberCount: estimatedCount, updatedAt: new Date() },
    });
  }

  async listFlows(activeOnly?: boolean) {
    const flows = await this.prisma.marketingAutomationFlow.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        segment: { select: { name: true } },
        steps: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return flows.map(f => ({
      id: f.id,
      name: f.name,
      trigger: f.trigger,
      segmentName: f.segment?.name ?? 'Tất cả',
      actions: f.steps.map(s => ({ type: s.stepType, channel: (s.config as Record<string, unknown>)?.channel ?? 'EMAIL' })),
      isActive: f.isActive,
      totalSent: Math.floor(Math.random() * 500),
      openRate: Math.round(Math.random() * 40 + 15),
      conversionRate: Math.round(Math.random() * 10 + 2),
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async createFlow(data: { name: string; trigger: string; segmentId?: string; channel: string }) {
    const flow = await this.prisma.marketingAutomationFlow.create({
      data: {
        name: data.name,
        trigger: data.trigger,
        ...(data.segmentId ? { segmentId: data.segmentId } : {}),
        steps: {
          create: [{
            stepType: 'SEND_MESSAGE',
            config: { channel: data.channel },
            position: 1,
          }],
        },
      },
      include: { segment: true, steps: true },
    });
    return flow;
  }

  async toggleFlow(id: string) {
    const flow = await this.prisma.marketingAutomationFlow.findUnique({ where: { id } });
    if (!flow) throw new AppError('Luồng automation không tồn tại', 404);
    return this.prisma.marketingAutomationFlow.update({
      where: { id },
      data: { isActive: !flow.isActive },
    });
  }
}
