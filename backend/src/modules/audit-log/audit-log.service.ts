import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class AuditLogService {
  constructor(private prisma: PrismaClient) {}

  async log(data: {
    actorId: string;
    actorType: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        id: uuidv4(),
        ...data,
        oldValue: data.oldValue ?? undefined,
        newValue: data.newValue ?? undefined,
      },
    });
  }

  async getLogs(params: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { skip, take } = getPaginationParams(params.page, params.limit);
    const where: any = {};

    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params.page, params.limit);
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
