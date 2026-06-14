import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class CampaignService {
  constructor(private prisma: PrismaClient) {}

  async getCampaigns(query: { page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = { status: 'ACTIVE' as const, endAt: { gte: new Date() } };
    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return buildPaginatedResult(campaigns, total, page, limit);
  }

  async getCampaignBySlug(slug: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: 'APPROVED' },
          include: { product: { include: { images: { take: 1 }, skus: { where: { isActive: true }, take: 1 } } } },
        },
        flashSaleSlots: {
          where: { isActive: true },
          include: { items: { where: { status: 'APPROVED' } } },
        },
      },
    });
    if (!campaign) throw new AppError('Campaign not found', 404);
    return campaign;
  }

  async createCampaign(data: {
    name: string;
    slug: string;
    description?: string;
    bannerUrl?: string;
    type: string;
    startAt: Date;
    endAt: Date;
  }, createdBy: string) {
    return this.prisma.campaign.create({
      data: {
        id: uuidv4(),
        ...data,
        type: data.type as 'GENERAL' | 'FLASH_SALE' | 'SEASONAL' | 'CATEGORY_FOCUS',
        createdBy,
      },
    });
  }

  async updateCampaign(id: string, data: Partial<{ name: string; description: string; bannerUrl: string; status: 'DRAFT' | 'ACTIVE' | 'ENDED' | 'CANCELLED'; startAt: Date; endAt: Date }>) {
    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async sellerRegisterCampaign(campaignId: string, shopId: string, productIds: string[]) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'ACTIVE') throw new AppError('Campaign not available', 400);

    const [seller] = await this.prisma.$transaction([
      this.prisma.campaignSeller.upsert({
        where: { campaignId_shopId: { campaignId, shopId } } as never,
        update: {},
        create: { id: uuidv4(), campaignId, shopId },
      }),
      ...productIds.map(productId =>
        this.prisma.campaignProduct.upsert({
          where: { campaignId_productId: { campaignId, productId } } as never,
          update: {},
          create: { id: uuidv4(), campaignId, productId },
        })
      ),
    ]);

    await publishEvent({
      eventName: 'campaign.seller_registered',
      entityId: campaignId,
      entityType: 'campaign',
      actorId: shopId,
      actorType: 'shop',
      source: 'seller_center',
    });

    return { message: 'Registered for campaign' };
  }

  // Flash Sale
  async createFlashSaleSlot(campaignId: string, data: { startAt: Date; endAt: Date }) {
    return this.prisma.flashSaleSlot.create({
      data: { id: uuidv4(), campaignId, ...data },
    });
  }

  async registerFlashSaleItem(data: {
    slotId: string;
    productId: string;
    skuId: string;
    flashPrice: number;
    quota: number;
  }) {
    return this.prisma.flashSaleItem.create({
      data: { id: uuidv4(), ...data },
    });
  }

  async approveFlashSaleItem(id: string, adminId: string) {
    const updated = await this.prisma.flashSaleItem.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await publishEvent({
      eventName: 'flash_sale.item_registered',
      entityId: id,
      entityType: 'flash_sale_item',
      actorId: adminId,
      actorType: 'admin',
    });

    return updated;
  }

  async getActiveFlashSales() {
    const now = new Date();
    return this.prisma.flashSaleSlot.findMany({
      where: { startAt: { lte: now }, endAt: { gte: now }, isActive: true },
      include: {
        items: {
          where: { status: 'APPROVED' },
          include: {
            product: { include: { images: { take: 1 } } },
            sku: true,
          },
        },
      },
    });
  }

  async getSellerCampaigns(shopId: string) {
    return this.prisma.campaignSeller.findMany({
      where: { shopId },
      include: { campaign: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSellerCampaign(shopId: string, data: any) {
    return this.prisma.campaign.create({
      data: {
        name: data.name,
        slug: `shop-${shopId}-${Date.now()}`,
        type: (data.type || 'GENERAL') as 'GENERAL' | 'FLASH_SALE' | 'SEASONAL' | 'CATEGORY_FOCUS',
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: 'DRAFT',
        createdBy: shopId,
      },
    });
  }

  async updateSellerCampaign(id: string, shopId: string, data: any) {
    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
      },
    });
  }

  async toggleSellerCampaign(id: string, shopId: string) {
    const c = await this.prisma.campaign.findUniqueOrThrow({ where: { id } });
    // CampaignStatus: DRAFT | ACTIVE | ENDED | CANCELLED
    return this.prisma.campaign.update({
      where: { id },
      data: { status: c.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE' },
    });
  }

  async deleteSellerCampaign(id: string, shopId: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }
}
