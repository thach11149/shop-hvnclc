import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class WarehouseService {
  constructor(private prisma: PrismaClient) {}

  async listWarehouses() {
    return this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWarehouse(data: { name: string; code: string; address: string; province: string }) {
    return this.prisma.warehouse.create({ data: { id: uuidv4(), ...data } });
  }

  async toggleWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUniqueOrThrow({ where: { id } });
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: !warehouse.isActive },
    });
  }

  async getInventory(warehouseId?: string, search?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.sku = {
        OR: [
          { skuCode: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }
    return this.prisma.warehouseStock.findMany({
      where,
      include: { sku: { include: { product: true } }, warehouse: true },
    });
  }

  async adjustInventory(stockId: string, qty: number, reason: string) {
    const stock = await this.prisma.warehouseStock.findUniqueOrThrow({ where: { id: stockId } });
    const newQty = stock.quantity + qty;
    if (newQty < 0) throw new Error('Insufficient inventory');
    return this.prisma.$transaction([
      this.prisma.warehouseStock.update({ where: { id: stockId }, data: { quantity: newQty } }),
      this.prisma.warehouseStockMovement.create({
        data: {
          id: uuidv4(),
          stockId,
          type: qty > 0 ? 'INBOUND' : 'OUTBOUND',
          quantity: Math.abs(qty),
          note: reason,
        },
      }),
    ]);
  }

  async listInboundRequests(shopId: string) {
    return this.prisma.warehouseInboundRequest.findMany({
      where: { shopId },
      include: { warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInboundRequest(shopId: string, warehouseCode: string, _items: { sku: string; qty: number }[], note?: string) {
    const warehouse = await this.prisma.warehouse.findFirstOrThrow({ where: { code: warehouseCode } });
    return this.prisma.warehouseInboundRequest.create({
      data: {
        id: uuidv4(),
        shopId,
        warehouseId: warehouse.id,
        note,
        status: 'PENDING',
      },
    });
  }

  async submitInboundRequest(id: string) {
    return this.prisma.warehouseInboundRequest.update({
      where: { id },
      data: { status: 'SCHEDULED' },
    });
  }

  async listFulfillmentOrders(status?: string) {
    return this.prisma.fulfillmentOrder.findMany({
      where: status ? { status: status as any } : undefined,
      include: { warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseInventory(warehouseId?: string) {
    return this.prisma.warehouseStock.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: { sku: { include: { product: true } }, warehouse: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }
}
