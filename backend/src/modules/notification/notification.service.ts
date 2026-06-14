import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  async createNotification(notifData: {
    userId: string;
    title: string;
    body: string;
    type: string;
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        id: uuidv4(),
        userId: notifData.userId,
        title: notifData.title,
        body: notifData.body,
        type: notifData.type,
        data: {
          entityId: notifData.entityId,
          entityType: notifData.entityType,
          ...(notifData.metadata || {}),
        },
        isRead: false,
      },
    });
  }

  async getUserNotifications(userId: string, query: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
      userId,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  // ============================================================
  // Bulk notification helpers (called from other services)
  // ============================================================

  async notifyOrderCreated(buyerId: string, sellerId: string, orderId: string, orderNumber: string) {
    await Promise.all([
      this.createNotification({
        userId: buyerId,
        title: 'Đặt hàng thành công',
        body: `Đơn hàng #${orderNumber} đã được tạo. Chúng tôi sẽ xử lý sớm nhất.`,
        type: 'order_created',
        entityId: orderId,
        entityType: 'order',
      }),
      this.createNotification({
        userId: sellerId,
        title: 'Đơn hàng mới',
        body: `Bạn vừa nhận được đơn hàng mới #${orderNumber}.`,
        type: 'new_order',
        entityId: orderId,
        entityType: 'order',
      }),
    ]);
  }

  async notifyOrderStatusChanged(buyerId: string, orderId: string, orderNumber: string, newStatus: string) {
    const statusLabels: Record<string, string> = {
      SELLER_CONFIRMED: 'đã được người bán xác nhận',
      PACKED: 'đang được đóng gói',
      HANDED_TO_CARRIER: 'đã bàn giao vận chuyển',
      SHIPPING: 'đang giao hàng',
      DELIVERED: 'đã giao thành công',
      COMPLETED: 'đã hoàn thành',
      CANCELLED: 'đã bị hủy',
    };

    const label = statusLabels[newStatus] || newStatus;
    await this.createNotification({
      userId: buyerId,
      title: 'Cập nhật đơn hàng',
      body: `Đơn hàng #${orderNumber} ${label}.`,
      type: 'order_status_updated',
      entityId: orderId,
      entityType: 'order',
    });
  }

  async notifySellerApproval(userId: string, shopName: string, approved: boolean, reason?: string) {
    await this.createNotification({
      userId,
      title: approved ? 'Shop đã được duyệt' : 'Shop chưa được duyệt',
      body: approved
        ? `Shop "${shopName}" đã được phê duyệt. Bạn có thể đăng sản phẩm ngay!`
        : `Shop "${shopName}" chưa được duyệt. Lý do: ${reason || 'Vui lòng liên hệ hỗ trợ.'}`,
      type: approved ? 'seller_approved' : 'seller_rejected',
      entityType: 'shop',
    });
  }

  async notifyProductApproval(userId: string, productId: string, productName: string, approved: boolean, reason?: string) {
    await this.createNotification({
      userId,
      title: approved ? 'Sản phẩm đã được duyệt' : 'Sản phẩm bị từ chối',
      body: approved
        ? `"${productName}" đang hiển thị trên sàn.`
        : `"${productName}" bị từ chối. Lý do: ${reason || 'Vui lòng cập nhật lại.'}`,
      type: approved ? 'product_approved' : 'product_rejected',
      entityId: productId,
      entityType: 'product',
    });
  }

  async notifyWithdrawalStatus(userId: string, amount: number, approved: boolean, reason?: string) {
    await this.createNotification({
      userId,
      title: approved ? 'Rút tiền thành công' : 'Yêu cầu rút tiền bị từ chối',
      body: approved
        ? `${amount.toLocaleString('vi-VN')}đ đã được chuyển vào tài khoản của bạn.`
        : `Yêu cầu rút tiền bị từ chối. Lý do: ${reason || 'Vui lòng liên hệ hỗ trợ.'}`,
      type: approved ? 'withdrawal_approved' : 'withdrawal_rejected',
      entityType: 'withdrawal',
    });
  }
}
