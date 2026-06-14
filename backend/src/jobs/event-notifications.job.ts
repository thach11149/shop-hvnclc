import { PrismaClient } from '@prisma/client';
import { emailService } from '../modules/notification/email.service';
import { NotificationService } from '../modules/notification/notification.service';
import { logger } from '../shared/utils/logger';

// ============================================================
// Event-based notification dispatcher
// Polls EventLog for unprocessed events and sends notifications
// ============================================================

async function getProcessedEventCursor(prisma: PrismaClient): Promise<Date> {
  // We use a simple approach: look at events from the last run
  // In production, store this cursor in a DB table
  const lastProcessed = new Date(Date.now() - 5 * 60 * 1000); // last 5 minutes
  return lastProcessed;
}

export async function processNotificationEvents(prisma: PrismaClient) {
  const notificationService = new NotificationService(prisma);
  const since = await getProcessedEventCursor(prisma);

  const events = await prisma.eventLog.findMany({
    where: {
      createdAt: { gte: since },
      eventName: {
        in: [
          'seller.approved', 'seller.rejected',
          'product.approved', 'product.rejected',
          'order.created',
          'withdrawal.processed',
          'payment.paid',
        ],
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  for (const event of events) {
    try {
      await dispatchNotification(event, prisma, notificationService);
    } catch (err) {
      logger.error('[EventNotifications] Failed to dispatch', { event: event.eventName, err });
    }
  }
}

async function dispatchNotification(
  event: {
    eventName: string;
    entityId: string | null;
    actorId: string | null;
    payload: unknown;
  },
  prisma: PrismaClient,
  notificationService: NotificationService,
) {
  const payload = (event.payload || {}) as Record<string, unknown>;

  switch (event.eventName) {
    case 'seller.approved': {
      const shop = await prisma.shop.findUnique({
        where: { id: event.entityId! },
        include: { sellerProfile: { include: { user: true } } },
      });
      if (!shop) break;
      const userId = shop.sellerProfile.userId;
      const email = shop.sellerProfile.user.email;
      await Promise.all([
        notificationService.notifySellerApproval(userId, shop.name, true),
        emailService.sendSellerApprovalResult(email, { shopName: shop.name, approved: true }),
      ]);
      break;
    }

    case 'seller.rejected': {
      const shop = await prisma.shop.findUnique({
        where: { id: event.entityId! },
        include: { sellerProfile: { include: { user: true } } },
      });
      if (!shop) break;
      const userId = shop.sellerProfile.userId;
      const email = shop.sellerProfile.user.email;
      const reason = typeof payload.reason === 'string' ? payload.reason : undefined;
      await Promise.all([
        notificationService.notifySellerApproval(userId, shop.name, false, reason),
        emailService.sendSellerApprovalResult(email, { shopName: shop.name, approved: false, reason }),
      ]);
      break;
    }

    case 'product.approved': {
      const product = await prisma.product.findUnique({
        where: { id: event.entityId! },
        include: { shop: { include: { sellerProfile: { include: { user: true } } } } },
      });
      if (!product) break;
      const userId = product.shop.sellerProfile.userId;
      const email = product.shop.sellerProfile.user.email;
      await Promise.all([
        notificationService.notifyProductApproval(userId, product.id, product.name, true),
        emailService.sendProductApprovalResult(email, { productName: product.name, approved: true }),
      ]);
      break;
    }

    case 'product.rejected': {
      const product = await prisma.product.findUnique({
        where: { id: event.entityId! },
        include: { shop: { include: { sellerProfile: { include: { user: true } } } } },
      });
      if (!product) break;
      const userId = product.shop.sellerProfile.userId;
      const email = product.shop.sellerProfile.user.email;
      const reason = typeof payload.reason === 'string' ? payload.reason : undefined;
      await Promise.all([
        notificationService.notifyProductApproval(userId, product.id, product.name, false, reason),
        emailService.sendProductApprovalResult(email, { productName: product.name, approved: false, reason }),
      ]);
      break;
    }

    case 'order.created': {
      const order = await prisma.order.findUnique({
        where: { id: event.entityId! },
        include: {
          user: true,
          shop: { include: { sellerProfile: { include: { user: true } } } },
          items: { include: { sku: { include: { product: true } } } },
        },
      });
      if (!order) break;
      const sellerId = order.shop.sellerProfile.userId;
      await notificationService.notifyOrderCreated(order.userId, sellerId, order.id, order.orderNumber);
      // Email confirmation to buyer
      await emailService.sendOrderConfirmation(order.user.email, {
        orderNumber: order.orderNumber,
        total: order.totalAmount.toNumber(),
        items: order.items.map(i => ({
          name: i.productNameSnapshot,
          qty: i.quantity,
          price: i.finalPrice.toNumber(),
        })),
        shippingAddress: JSON.stringify(order.shippingAddressSnapshot),
      });
      // Email to seller
      await emailService.sendSellerNewOrder(order.shop.sellerProfile.user.email, {
        orderNumber: order.orderNumber,
        shopName: order.shop.name,
        total: order.totalAmount.toNumber(),
        itemCount: order.items.length,
      });
      break;
    }

    case 'withdrawal.processed': {
      const { shopId, amount } = payload as { shopId: string; amount: number };
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: { sellerProfile: { include: { user: true } } },
      });
      if (!shop) break;
      const userId = shop.sellerProfile.userId;
      const email = shop.sellerProfile.user.email;
      await Promise.all([
        notificationService.notifyWithdrawalStatus(userId, Number(amount), true),
        emailService.sendWithdrawalStatus(email, { amount: Number(amount), status: 'approved' }),
      ]);
      break;
    }

    default:
      break;
  }
}

export function startEventNotificationsScheduler(prisma: PrismaClient) {
  const intervalMs = 60 * 1000; // every 1 minute

  logger.info('[EventNotifications] Scheduler started — polling every 1 minute');

  setInterval(() => {
    processNotificationEvents(prisma).catch(err =>
      logger.error('[EventNotifications] Run failed', { err }),
    );
  }, intervalMs);
}
