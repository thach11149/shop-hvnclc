import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  async getStock(skuId: string) {
    const stock = await this.prisma.inventoryStock.findUnique({ where: { skuId } });
    if (!stock) throw new AppError('Stock not found', 404);
    return {
      ...stock,
      availableQuantity: stock.totalQuantity - stock.reservedQuantity - stock.soldQuantity,
    };
  }

  async updateStock(skuId: string, quantity: number, shopId: string) {
    const stock = await this.prisma.inventoryStock.upsert({
      where: { skuId },
      update: { totalQuantity: { increment: quantity } },
      create: { id: uuidv4(), skuId, totalQuantity: Math.max(0, quantity) },
    });

    await publishEvent({
      eventName: 'inventory.updated',
      entityId: skuId,
      entityType: 'sku',
      payload: { quantity, shopId },
      source: 'seller_center',
    });

    return stock;
  }

  async reserveStock(orderId: string, items: { skuId: string; quantity: number }[]) {
    for (const item of items) {
      const stock = await this.prisma.inventoryStock.findUnique({
        where: { skuId: item.skuId },
        select: { id: true, totalQuantity: true, reservedQuantity: true, soldQuantity: true },
      });

      if (!stock) throw new AppError(`SKU ${item.skuId} stock not found`, 400);

      const available = stock.totalQuantity - stock.reservedQuantity - stock.soldQuantity;
      if (available < item.quantity) {
        throw new AppError(`Insufficient stock for SKU ${item.skuId}`, 400);
      }

      await this.prisma.$transaction([
        this.prisma.inventoryStock.update({
          where: { id: stock.id },
          data: { reservedQuantity: { increment: item.quantity } },
        }),
        this.prisma.inventoryReservation.create({
          data: {
            id: uuidv4(),
            stockId: stock.id,
            orderId,
            quantity: item.quantity,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
          },
        }),
      ]);

      await publishEvent({
        eventName: 'inventory.reserved',
        entityId: item.skuId,
        entityType: 'sku',
        payload: { orderId, quantity: item.quantity },
      });
    }
  }

  async releaseReservation(orderId: string) {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
    });

    for (const res of reservations) {
      await this.prisma.$transaction([
        this.prisma.inventoryStock.update({
          where: { id: res.stockId },
          data: { reservedQuantity: { decrement: res.quantity } },
        }),
        this.prisma.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'RELEASED', releasedAt: new Date() },
        }),
      ]);

      await publishEvent({
        eventName: 'inventory.released',
        entityId: res.stockId,
        entityType: 'inventory_stock',
        payload: { orderId, quantity: res.quantity },
      });
    }
  }

  async deductStock(orderId: string) {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
    });

    for (const res of reservations) {
      await this.prisma.$transaction([
        this.prisma.inventoryStock.update({
          where: { id: res.stockId },
          data: {
            reservedQuantity: { decrement: res.quantity },
            soldQuantity: { increment: res.quantity },
          },
        }),
        this.prisma.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'DEDUCTED' },
        }),
      ]);

      await publishEvent({
        eventName: 'inventory.deducted',
        entityId: res.stockId,
        entityType: 'inventory_stock',
        payload: { orderId, quantity: res.quantity },
      });
    }
  }

  async checkAvailability(items: { skuId: string; quantity: number }[]) {
    const results = [];
    for (const item of items) {
      const stock = await this.prisma.inventoryStock.findUnique({ where: { skuId: item.skuId } });
      const available = stock ? stock.totalQuantity - stock.reservedQuantity - stock.soldQuantity : 0;
      results.push({
        skuId: item.skuId,
        requested: item.quantity,
        available,
        isAvailable: available >= item.quantity,
      });
    }
    return results;
  }
}
