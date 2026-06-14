import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../../shared/utils/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter;
  private from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'HVNCLC Shop <no-reply@hvnclc.vn>';

    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Use Ethereal for dev/test - mails are caught and inspectable at https://ethereal.email
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER || 'demo@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'demo',
        },
      });
    }
  }

  async send(options: EmailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      logger.info('Email sent', { messageId: info.messageId, to: options.to });
      return info;
    } catch (error) {
      logger.error('Email send failed', { error, to: options.to, subject: options.subject });
      // Don't throw — email failures should not crash business flows
    }
  }

  // ============================================================
  // Template methods
  // ============================================================

  async sendOrderConfirmation(to: string, data: {
    orderNumber: string;
    total: number;
    items: Array<{ name: string; qty: number; price: number }>;
    shippingAddress: string;
  }) {
    const itemRows = data.items
      .map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toLocaleString('vi-VN')}đ</td></tr>`)
      .join('');

    await this.send({
      to,
      subject: `[HVNCLC] Xác nhận đơn hàng #${data.orderNumber}`,
      html: `
        <h2>Xác nhận đơn hàng #${data.orderNumber}</h2>
        <p>Cảm ơn bạn đã đặt hàng tại HVNCLC!</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
          <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p><strong>Tổng thanh toán: ${data.total.toLocaleString('vi-VN')}đ</strong></p>
        <p>Địa chỉ giao hàng: ${data.shippingAddress}</p>
        <hr/>
        <p style="font-size:12px;color:#888">Email tự động từ HVNCLC Shop.</p>
      `,
    });
  }

  async sendSellerNewOrder(to: string, data: {
    orderNumber: string;
    shopName: string;
    total: number;
    itemCount: number;
  }) {
    await this.send({
      to,
      subject: `[HVNCLC Seller] Đơn hàng mới #${data.orderNumber}`,
      html: `
        <h2>Bạn có đơn hàng mới!</h2>
        <p>Shop <strong>${data.shopName}</strong> vừa nhận được đơn hàng mới.</p>
        <ul>
          <li>Mã đơn: <strong>#${data.orderNumber}</strong></li>
          <li>Số sản phẩm: ${data.itemCount}</li>
          <li>Tổng tiền: <strong>${data.total.toLocaleString('vi-VN')}đ</strong></li>
        </ul>
        <p>Đăng nhập vào Seller Center để xử lý đơn hàng.</p>
      `,
    });
  }

  async sendPasswordReset(to: string, data: { resetUrl: string; expiresIn: string }) {
    await this.send({
      to,
      subject: '[HVNCLC] Đặt lại mật khẩu',
      html: `
        <h2>Đặt lại mật khẩu</h2>
        <p>Nhấn vào link bên dưới để đặt lại mật khẩu. Link có hiệu lực trong ${data.expiresIn}.</p>
        <p><a href="${data.resetUrl}" style="background:#ff6000;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block">Đặt lại mật khẩu</a></p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      `,
    });
  }

  async sendSellerApprovalResult(to: string, data: {
    shopName: string;
    approved: boolean;
    reason?: string;
  }) {
    const subject = data.approved
      ? `[HVNCLC] Shop "${data.shopName}" đã được duyệt`
      : `[HVNCLC] Shop "${data.shopName}" chưa được duyệt`;

    await this.send({
      to,
      subject,
      html: data.approved
        ? `<h2>Chúc mừng! Shop của bạn đã được duyệt.</h2>
           <p>Shop <strong>${data.shopName}</strong> đã được HVNCLC phê duyệt. Bạn có thể bắt đầu đăng sản phẩm ngay.</p>`
        : `<h2>Shop của bạn chưa được duyệt.</h2>
           <p>Shop <strong>${data.shopName}</strong> chưa đáp ứng điều kiện. Lý do: ${data.reason || 'Vui lòng liên hệ hỗ trợ.'}</p>`,
    });
  }

  async sendProductApprovalResult(to: string, data: {
    productName: string;
    approved: boolean;
    reason?: string;
  }) {
    await this.send({
      to,
      subject: data.approved
        ? `[HVNCLC] Sản phẩm "${data.productName}" đã được duyệt`
        : `[HVNCLC] Sản phẩm "${data.productName}" bị từ chối`,
      html: data.approved
        ? `<h2>Sản phẩm đã được duyệt!</h2><p><strong>${data.productName}</strong> đang hiển thị trên sàn.</p>`
        : `<h2>Sản phẩm bị từ chối</h2><p><strong>${data.productName}</strong> chưa đạt yêu cầu. Lý do: ${data.reason || 'Vui lòng cập nhật lại sản phẩm.'}</p>`,
    });
  }

  async sendWithdrawalStatus(to: string, data: {
    amount: number;
    status: 'approved' | 'rejected';
    reason?: string;
  }) {
    await this.send({
      to,
      subject: `[HVNCLC] Yêu cầu rút tiền ${data.status === 'approved' ? 'đã được xử lý' : 'bị từ chối'}`,
      html: data.status === 'approved'
        ? `<h2>Yêu cầu rút tiền thành công</h2><p>Số tiền <strong>${data.amount.toLocaleString('vi-VN')}đ</strong> đã được chuyển vào tài khoản của bạn.</p>`
        : `<h2>Yêu cầu rút tiền bị từ chối</h2><p>Lý do: ${data.reason || 'Vui lòng liên hệ hỗ trợ.'}</p>`,
    });
  }
}

export const emailService = new EmailService();
