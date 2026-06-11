import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';

export class CartService {
  constructor(private prisma: PrismaClient) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: {
                  include: {
                    images: { take: 1 },
                    shop: { select: { id: true, name: true, slug: true } },
                  },
                },
                inventoryStock: { select: { totalQuantity: true, reservedQuantity: true, soldQuantity: true } },
                variantValues: { include: { option: { include: { group: true } } } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { id: uuidv4(), userId },
        include: { items: { include: { sku: { include: { product: { include: { images: { take: 1 }, shop: { select: { id: true, name: true, slug: true } } } }, inventoryStock: true, variantValues: { include: { option: { include: { group: true } } } } } } } } },
      });
    }

    return this.enrichCart(cart);
  }

  async addItem(userId: string, skuId: string, quantity: number) {
    const sku = await this.prisma.sKU.findUnique({
      where: { id: skuId },
      include: {
        product: { select: { status: true, shopId: true } },
        inventoryStock: true,
      },
    });

    if (!sku || !sku.isActive) throw new AppError('SKU not found or unavailable', 404);
    if (sku.product.status !== 'ACTIVE') throw new AppError('Product not available', 400);
    if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);

    const available = sku.inventoryStock
      ? sku.inventoryStock.totalQuantity - sku.inventoryStock.reservedQuantity - sku.inventoryStock.soldQuantity
      : 0;
    if (available < quantity) throw new AppError('Insufficient stock', 400);

    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { id: uuidv4(), userId } });
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_skuId: { cartId: cart.id, skuId } },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { id: uuidv4(), cartId: cart.id, skuId, quantity },
      });
    }

    await publishEvent({
      eventName: 'cart.item_added',
      actorId: userId,
      actorType: 'user',
      entityId: skuId,
      entityType: 'sku',
      payload: { quantity },
      source: 'buyer_web',
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new AppError('Cart item not found', 404);

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new AppError('Cart item not found', 404);

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    await publishEvent({
      eventName: 'cart.item_removed',
      actorId: userId,
      actorType: 'user',
      entityId: item.skuId,
      entityType: 'sku',
      source: 'buyer_web',
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  private enrichCart(cart: { id: string; userId: string; items: unknown[] } & Record<string, unknown>) {
    const items = cart.items as Array<{
      id: string;
      quantity: number;
      sku: {
        id: string;
        price: { toNumber: () => number };
        inventoryStock: { totalQuantity: number; reservedQuantity: number; soldQuantity: number } | null;
      };
    }>;

    const enrichedItems = items.map(item => {
      const available = item.sku.inventoryStock
        ? item.sku.inventoryStock.totalQuantity - item.sku.inventoryStock.reservedQuantity - item.sku.inventoryStock.soldQuantity
        : 0;
      return {
        ...item,
        availableQuantity: available,
        isAvailable: available >= item.quantity,
        subtotal: item.sku.price.toNumber() * item.quantity,
      };
    });

    const subtotal = enrichedItems.reduce((sum, i) => sum + i.subtotal, 0);

    return { ...cart, items: enrichedItems, subtotal };
  }
}
