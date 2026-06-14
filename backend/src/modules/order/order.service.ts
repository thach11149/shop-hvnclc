import { PrismaClient, OrderStatus, PaymentMethod } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';
import { createNotification } from '../../shared/utils/notification';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';
import { InventoryService } from '../inventory/inventory.service';
import { PromotionService } from '../promotion/promotion.service';

interface CheckoutItem {
  skuId: string;
  quantity: number;
}

interface ItemDetail {
  skuId: string;
  productId: string;
  productName: string;
  skuName: string;
  shopId: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface CheckoutData {
  items: CheckoutItem[];
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
  noteFromBuyer?: string;
  affiliateCode?: string;
}

export class OrderService {
  constructor(
    private prisma: PrismaClient,
    private inventoryService: InventoryService,
    private promotionService: PromotionService
  ) {}

  async previewCheckout(userId: string, data: CheckoutData) {
    const { items, shippingAddressId, voucherCode } = data;

    const address = await this.prisma.userAddress.findFirst({
      where: { id: shippingAddressId, userId },
    });
    if (!address) throw new AppError('Shipping address not found', 404);

    const itemDetails = await this.getItemDetails(items);
    const subtotal = itemDetails.reduce((sum, i) => sum + i.subtotal, 0);
    const shippingFee = this.calculateShippingFee(subtotal, address.province);

    let discountAmount = 0;
    let promotionId: string | undefined;

    if (voucherCode) {
      const promoResult = await this.promotionService.validateVoucher(
        voucherCode,
        userId,
        itemDetails.map(i => ({ skuId: i.skuId, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.subtotal, shopId: i.shopId })),
        subtotal
      );
      discountAmount = promoResult.discountAmount;
      promotionId = promoResult.promotionId;
    }

    const platformFee = subtotal * 0.02; // 2% platform fee
    const total = subtotal - discountAmount + shippingFee + platformFee;

    return {
      items: itemDetails,
      subtotal,
      discountAmount,
      shippingFee,
      platformFee,
      total,
      promotionId,
      shippingAddress: address,
    };
  }

  async createOrder(userId: string, data: CheckoutData) {
    const preview = await this.previewCheckout(userId, data);

    const itemsBySeller = this.groupItemsBySeller(preview.items as ItemDetail[]);
    const orders = [];

    for (const [shopId, shopItems] of Object.entries(itemsBySeller)) {
      const shopSubtotal = shopItems.reduce((sum: number, i: ItemDetail) => sum + i.subtotal, 0);
      const shopShippingFee = this.calculateShippingFee(shopSubtotal, preview.shippingAddress.province);

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const order = await this.prisma.order.create({
        data: {
          id: uuidv4(),
          orderNumber,
          userId,
          shopId,
          status: data.paymentMethod === PaymentMethod.COD
            ? OrderStatus.AWAITING_SELLER_CONFIRM
            : OrderStatus.PENDING_PAYMENT,
          subtotal: shopSubtotal,
          discountAmount: 0,
          shippingFee: shopShippingFee,
          platformFee: shopSubtotal * 0.02,
          totalAmount: shopSubtotal + shopShippingFee + (shopSubtotal * 0.02),
          paymentMethod: data.paymentMethod,
          shippingAddressSnapshot: preview.shippingAddress as object,
          noteFromBuyer: data.noteFromBuyer,
          source: 'buyer_web',
          items: {
            create: shopItems.map((item: ItemDetail) => ({
              id: uuidv4(),
              sku: { connect: { id: item.skuId } },
              productNameSnapshot: item.productName,
              skuNameSnapshot: item.skuName,
              skuImageSnapshot: item.image,
              unitPrice: item.unitPrice,
              discountAmount: 0,
              finalPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
          statusHistories: {
            create: [{
              id: uuidv4(),
              toStatus: data.paymentMethod === PaymentMethod.COD
                ? OrderStatus.AWAITING_SELLER_CONFIRM
                : OrderStatus.PENDING_PAYMENT,
              actorId: userId,
              actorType: 'user',
              note: 'Order created',
            }],
          },
          payment: {
            create: {
              id: uuidv4(),
              method: data.paymentMethod,
              amount: shopSubtotal + shopShippingFee + (shopSubtotal * 0.02),
              status: data.paymentMethod === PaymentMethod.COD ? 'UNPAID' : 'PENDING',
            },
          },
          shipment: {
            create: {
              id: uuidv4(),
              status: 'PENDING',
              shippingFee: shopShippingFee,
            },
          },
        },
      });

      await this.inventoryService.reserveStock(
        order.id,
        (shopItems as ItemDetail[]).map(i => ({ skuId: i.skuId, quantity: i.quantity }))
      );

      await publishEvent({
        eventName: 'order.created',
        actorId: userId,
        actorType: 'user',
        entityId: order.id,
        entityType: 'order',
        payload: { orderNumber, shopId, total: order.totalAmount },
        source: 'buyer_web',
      });

      // Notify seller about new order
      const shopOwner = await this.prisma.sellerProfile.findFirst({
        where: { shop: { id: shopId } },
        select: { userId: true },
      });
      if (shopOwner) {
        await createNotification({
          userId: shopOwner.userId,
          type: 'NEW_ORDER',
          title: 'Đơn hàng mới',
          body: `Bạn có đơn hàng mới #${orderNumber}`,
          data: { orderId: order.id, orderNumber },
        });
      }

      orders.push(order);
    }

    // Redeem voucher if applied
    if (preview.promotionId && data.voucherCode) {
      for (const order of orders) {
        await this.promotionService.redeemVoucher(preview.promotionId, order.id, userId, preview.discountAmount / orders.length);
      }
    }

    // Clear cart
    await this.clearCartItems(userId, data.items.map(i => i.skuId));

    return orders;
  }

  async getBuyerOrders(userId: string, query: { status?: OrderStatus; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = { userId, ...(query.status && { status: query.status }) };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { sku: { include: { product: { include: { images: { take: 1 } } } } } } }, shop: { select: { id: true, name: true, logo: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return buildPaginatedResult(orders, total, page, limit);
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { sku: { include: { product: { include: { images: { take: 1 } } } } } } },
        shop: { select: { id: true, name: true, logo: true, slug: true } },
        statusHistories: { orderBy: { createdAt: 'asc' } },
        payment: true,
        shipment: { include: { trackingLogs: { orderBy: { timestamp: 'desc' } } } },
        promotionRedemptions: true,
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async cancelOrder(orderId: string, userId: string, reason: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new AppError('Order not found', 404);

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.AWAITING_SELLER_CONFIRM,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelReason: reason,
        cancelledBy: userId,
        cancelledAt: new Date(),
        statusHistories: {
          create: {
            id: uuidv4(),
            fromStatus: order.status,
            toStatus: OrderStatus.CANCELLED,
            actorId: userId,
            actorType: 'user',
            note: reason,
          },
        },
      },
    });

    await this.inventoryService.releaseReservation(orderId);

    await publishEvent({
      eventName: 'order.cancelled',
      actorId: userId,
      actorType: 'user',
      entityId: orderId,
      entityType: 'order',
      payload: { reason },
      source: 'buyer_web',
    });

    return { message: 'Order cancelled successfully' };
  }

  // SELLER
  async getSellerOrders(shopId: string, query: { status?: OrderStatus; search?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = {
      shopId,
      ...(query.status && { status: query.status }),
      ...(query.fromDate || query.toDate ? {
        createdAt: {
          ...(query.fromDate && { gte: new Date(query.fromDate) }),
          ...(query.toDate && { lte: new Date(query.toDate + 'T23:59:59Z') }),
        }
      } : {}),
      ...(query.search && {
        OR: [
          { orderNumber: { contains: query.search, mode: 'insensitive' } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { name: true, images: { take: 1 } } } } },
          user: { select: { id: true, email: true, buyerProfile: { select: { fullName: true, phone: true } } } },
          shippingAddress: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return buildPaginatedResult(orders, total, page, limit);
  }

  async sellerConfirmOrder(orderId: string, shopId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shopId, status: OrderStatus.AWAITING_SELLER_CONFIRM },
    });
    if (!order) throw new AppError('Order not found or cannot be confirmed', 404);

    return this.updateOrderStatus(orderId, OrderStatus.SELLER_CONFIRMED, shopId, 'seller');
  }

  async sellerPackOrder(orderId: string, shopId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shopId, status: OrderStatus.SELLER_CONFIRMED },
    });
    if (!order) throw new AppError('Order not found or cannot be packed', 404);

    return this.updateOrderStatus(orderId, OrderStatus.PACKED, shopId, 'seller');
  }

  // ADMIN
  async getAdminOrders(query: { status?: OrderStatus; shopId?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = {
      ...(query.status && { status: query.status }),
      ...(query.shopId && { shopId: query.shopId }),
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { shop: { select: { id: true, name: true } }, user: { select: { id: true, email: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return buildPaginatedResult(orders, total, page, limit);
  }

  async markOrderDelivered(orderId: string, actorId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    await this.updateOrderStatus(orderId, OrderStatus.DELIVERED, actorId, 'system');
    return this.updateOrderStatus(orderId, OrderStatus.COMPLETED, actorId, 'system');
  }

  private async updateOrderStatus(orderId: string, status: OrderStatus, actorId: string, actorType: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.COMPLETED && { completedAt: new Date() }),
        statusHistories: {
          create: {
            id: uuidv4(),
            fromStatus: order?.status,
            toStatus: status,
            actorId,
            actorType,
          },
        },
      },
    });

    // Notify buyer about order status change
    if (order?.userId) {
      const statusMessages: Partial<Record<OrderStatus, string>> = {
        [OrderStatus.SELLER_CONFIRMED]: 'Shop đã xác nhận đơn hàng của bạn',
        [OrderStatus.SHIPPING]: 'Đơn hàng đang được giao',
        [OrderStatus.DELIVERED]: 'Đơn hàng đã được giao thành công',
        [OrderStatus.COMPLETED]: 'Đơn hàng hoàn tất. Hãy đánh giá sản phẩm!',
        [OrderStatus.CANCELLED]: 'Đơn hàng đã bị hủy',
      };
      const msg = statusMessages[status];
      if (msg) {
        await createNotification({
          userId: order.userId,
          type: 'ORDER_STATUS',
          title: 'Cập nhật đơn hàng',
          body: msg,
          data: { orderId, status },
        });
      }
    }

    await publishEvent({
      eventName: `order.${status.toLowerCase()}`,
      entityId: orderId,
      entityType: 'order',
      actorId,
      actorType,
    });

    return updated;
  }

  private async getItemDetails(items: CheckoutItem[]) {
    return Promise.all(
      items.map(async item => {
        const sku = await this.prisma.sKU.findUnique({
          where: { id: item.skuId },
          include: {
            product: {
              select: { id: true, name: true, status: true, shopId: true, images: { take: 1 } },
            },
            inventoryStock: true,
          },
        });

        if (!sku || !sku.isActive) throw new AppError(`SKU ${item.skuId} not available`, 400);
        if (sku.product.status !== 'ACTIVE') throw new AppError(`Product not available`, 400);

        const available = sku.inventoryStock
          ? sku.inventoryStock.totalQuantity - sku.inventoryStock.reservedQuantity - sku.inventoryStock.soldQuantity
          : 0;
        if (available < item.quantity) throw new AppError(`Insufficient stock for ${sku.name}`, 400);

        return {
          skuId: sku.id,
          productId: sku.product.id,
          productName: sku.product.name,
          skuName: sku.name,
          shopId: sku.product.shopId,
          image: sku.product.images[0]?.url,
          quantity: item.quantity,
          unitPrice: sku.price.toNumber(),
          subtotal: sku.price.toNumber() * item.quantity,
        };
      })
    );
  }

  private groupItemsBySeller(items: ItemDetail[]) {
    const grouped: Record<string, ItemDetail[]> = {};
    for (const item of items) {
      if (!grouped[item.shopId]) grouped[item.shopId] = [];
      grouped[item.shopId].push(item);
    }
    return grouped;
  }

  async getSellerAnalyticsRevenue(shopId: string, period: string) {
    const now = new Date();
    let fromDate: Date;
    if (period === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const orders = await this.prisma.order.findMany({
      where: { shopId, status: { not: OrderStatus.CANCELLED }, createdAt: { gte: fromDate } },
      select: { totalAmount: true, createdAt: true },
    });
    const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { period, revenue, ordersCount: orders.length };
  }

  async getSellerAnalyticsOrders(shopId: string) {
    const statuses = ['AWAITING_SELLER_CONFIRM', 'SELLER_CONFIRMED', 'PACKED', 'HANDED_TO_CARRIER', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    const counts = await Promise.all(
      statuses.map(async s => {
        const count = await this.prisma.order.count({ where: { shopId, status: s as OrderStatus } });
        return { status: s, count };
      })
    );
    return counts;
  }

  async getSellerTopProducts(shopId: string) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { shopId, status: { notIn: [OrderStatus.CANCELLED] } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 5,
    });
    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: { take: 1 } },
    });
    return items.map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId),
    }));
  }

  async getSellerRevenue30Days(shopId: string) {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const orders = await this.prisma.order.findMany({
      where: {
        shopId,
        status: { notIn: [OrderStatus.CANCELLED] },
        createdAt: { gte: days[0] },
      },
      select: { totalAmount: true, createdAt: true },
    });
    const prevFrom = new Date(days[0].getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevOrders = await this.prisma.order.findMany({
      where: {
        shopId,
        status: { notIn: [OrderStatus.CANCELLED] },
        createdAt: { gte: prevFrom, lt: days[0] },
      },
      select: { totalAmount: true, createdAt: true },
    });
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
    const daily = days.map(d => {
      const dateStr = toDateStr(d);
      const current = orders.filter(o => toDateStr(new Date(o.createdAt)) === dateStr)
        .reduce((s, o) => s + Number(o.totalAmount), 0);
      const prevDate = new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevDateStr = toDateStr(prevDate);
      const previous = prevOrders.filter(o => toDateStr(new Date(o.createdAt)) === prevDateStr)
        .reduce((s, o) => s + Number(o.totalAmount), 0);
      return { date: dateStr, current, previous };
    });
    return daily;
  }

  async bulkUpdateOrders(shopId: string, orderIds: string[], action: string, data: any) {
    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds }, shopId },
    });
    if (orders.length !== orderIds.length) throw new AppError('Some orders not found or not yours', 400);

    if (action === 'confirm') {
      await this.prisma.order.updateMany({
        where: { id: { in: orderIds }, shopId, status: OrderStatus.AWAITING_SELLER_CONFIRM },
        data: { status: OrderStatus.SELLER_CONFIRMED },
      });
    } else if (action === 'deliver') {
      await this.prisma.order.updateMany({
        where: { id: { in: orderIds }, shopId },
        data: { status: OrderStatus.DELIVERED },
      });
      await Promise.all(orderIds.map(id =>
        this.prisma.shipment.upsert({
          where: { orderId: id },
          create: { id: uuidv4(), orderId: id, deliveredAt: new Date(), status: 'DELIVERED' as any },
          update: { deliveredAt: new Date(), status: 'DELIVERED' as any },
        })
      ));
    } else if (action === 'tracking') {
      await Promise.all(orderIds.map(id =>
        this.prisma.shipment.upsert({
          where: { orderId: id },
          create: { id: uuidv4(), orderId: id, trackingNumber: data.trackingCode, carrierId: data.carrierId || undefined, status: 'PICKED_UP' as any },
          update: { trackingNumber: data.trackingCode, ...(data.carrierId && { carrierId: data.carrierId }) },
        })
      ));
    }
    return { updated: orderIds.length };
  }

  async getShippingLabel(orderId: string, shopId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shopId },
      include: {
        user: { select: { email: true, buyerProfile: { select: { fullName: true, phone: true } } } },
        items: { include: { product: { select: { name: true } } } },
        shipment: { select: { trackingNumber: true } },
        shop: { select: { name: true, addressLine: true, province: true, phone: true } },
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    const snapshot = (order.shippingAddressSnapshot || {}) as any;
    return {
      orderNumber: order.orderNumber,
      trackingCode: order.shipment?.trackingNumber,
      sender: {
        name: (order.shop as any)?.name,
        address: [(order.shop as any)?.addressLine, (order.shop as any)?.province].filter(Boolean).join(', '),
        phone: (order.shop as any)?.phone,
      },
      recipient: {
        name: order.user?.buyerProfile?.fullName || order.user?.email,
        phone: order.user?.buyerProfile?.phone || snapshot.phone,
        address: [snapshot.address, snapshot.ward, snapshot.district, snapshot.province].filter(Boolean).join(', '),
      },
      items: order.items.map((i: any) => ({ name: i.product?.name || i.productName, quantity: i.quantity })),
      totalAmount: order.totalAmount,
      codAmount: order.paymentMethod === 'COD' ? order.totalAmount : 0,
      createdAt: order.createdAt,
    };
  }

  private calculateShippingFee(subtotal: number, _province: string): number {
    if (subtotal >= 500000) return 0; // Free shipping over 500k VND
    return 30000; // Default 30k shipping fee
  }

  private async clearCartItems(userId: string, skuIds: string[]) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, skuId: { in: skuIds } },
      });
    }
  }
}
