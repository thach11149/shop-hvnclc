import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';

export class SystemConfigService {
  constructor(private prisma: PrismaClient) {}

  async getAll(group?: string) {
    const where: any = {};
    if (group) where.group = group;
    return this.prisma.systemConfig.findMany({ where, orderBy: { key: 'asc' } });
  }

  async getByKey(key: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!config) throw new AppError(`Config key '${key}' not found`, 404);
    return config;
  }

  async upsert(adminId: string, data: { key: string; value: any; description?: string; group?: string }) {
    return this.prisma.systemConfig.upsert({
      where: { key: data.key },
      update: { value: data.value, description: data.description, updatedBy: adminId },
      create: {
        id: uuidv4(),
        key: data.key,
        value: data.value,
        description: data.description,
        group: data.group || 'general',
        updatedBy: adminId,
      },
    });
  }

  async delete(key: string) {
    const existing = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!existing) throw new AppError(`Config key '${key}' not found`, 404);
    await this.prisma.systemConfig.delete({ where: { key } });
    return { message: 'Deleted' };
  }

  async getPublicConfigs() {
    const PUBLIC_KEYS = ['site_name', 'site_logo', 'contact_email', 'min_order_amount', 'max_return_days', 'payment_methods'];
    return this.prisma.systemConfig.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  }
}
