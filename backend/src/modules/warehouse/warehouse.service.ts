import { PrismaClient } from '@prisma/client';

export class WarehouseService {
  constructor(private prisma: PrismaClient) {}

  async listWarehouses() {
    return this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWarehouse(data: { name: string; code: string; address: string; province: string }) {
    return this.prisma.warehouse.create({ data });
  }

  async toggleWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUniqueOrThrow({ where: { id } });
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: !warehouse.isActive },
    });
  }

  async getInventory(shopId: string, search?: string) {
    const where: any = { shopId };
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.skuInventory.findMany({
      where,
      include: { sku: { include: { product: true } }, warehouse: true },
    });
  }

  async adjustInventory(id: string, shopId: string, qty: number, reason: string) {
    const inventory = await this.prisma.skuInventory.findFirstOrThrow({ where: { id, shopId } });
    const newQty = inventory.qty + qty;
    if (newQty < 0) throw new Error('Insufficient inventory');
    return this.prisma.$transaction([
      this.prisma.skuInventory.update({ where: { id }, data: { qty: newQty } }),
      this.prisma.inventoryAdjustment.create({
        data: { skuInventoryId: id, shopId, delta: qty, reason, type: qty > 0 ? 'IN' : 'OUT' },
      }),
    ]);
  }

  async listInboundOrders(shopId: string) {
    return this.prisma.warehouseInboundOrder.findMany({
      where: { shopId },
      include: { items: { include: { sku: true } }, warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInboundOrder(shopId: string, warehouseCode: string, items: { sku: string; qty: number }[]) {
    const warehouse = await this.prisma.warehouse.findFirstOrThrow({ where: { code: warehouseCode } });
    return this.prisma.warehouseInboundOrder.create({
      data: {
        shopId,
        warehouseId: warehouse.id,
        status: 'DRAFT',
        items: {
          create: items.map(i => ({ skuCode: i.sku, expectedQty: i.qty })),
        },
      },
      include: { items: true },
    });
  }

  async submitInboundOrder(id: string, shopId: string) {
    return this.prisma.warehouseInboundOrder.update({
      where: { id, shopId, status: 'DRAFT' },
      data: { status: 'SUBMITTED' },
    });
  }

  async listFulfillmentOrders(type: string) {
    return this.prisma.fulfillmentOrder.findMany({
      where: type ? { type } : undefined,
      include: { warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseInventory() {
    return this.prisma.skuInventory.findMany({
      include: { sku: { include: { product: true } }, warehouse: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }
}
