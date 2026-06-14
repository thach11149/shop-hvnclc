import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class AnnouncementService {
  constructor(private prisma: PrismaClient) {}

  async list(params: { target?: string; type?: string; active?: boolean; page?: number; limit?: number }) {
    const { skip, take } = getPaginationParams(params.page, params.limit);
    const where: any = {};
    if (params.target) where.target = { in: [params.target, 'ALL'] };
    if (params.type) where.type = params.type;
    if (params.active !== undefined) where.isActive = params.active;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.announcement.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params.page, params.limit);
  }

  async create(adminId: string, data: { title: string; content: string; type?: string; target?: string; expiresAt?: string }) {
    return this.prisma.announcement.create({
      data: {
        id: uuidv4(),
        title: data.title,
        content: data.content,
        type: data.type || 'INFO',
        target: data.target || 'ALL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        publishedAt: new Date(),
        createdBy: adminId,
      },
    });
  }

  async update(id: string, data: Partial<{ title: string; content: string; type: string; target: string; isActive: boolean; expiresAt: string }>) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new AppError('Announcement not found', 404);

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new AppError('Announcement not found', 404);
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
