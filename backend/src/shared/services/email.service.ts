import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  private async send(options: EmailOptions) {
    if (!process.env.SMTP_USER) {
      logger.info(`[EMAIL MOCK] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }
    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Shop HVNCLC'}" <${process.env.SMTP_USER}>`,
      ...options,
    });
  }

  async sendOrderConfirmed(to: string, data: { orderCode: string; items: any[]; total: number; buyerName: string }) {
    const itemRows = data.items
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price.toLocaleString('vi-VN')}đ</td></tr>`
      )
      .join('');

    await this.send({
      to,
      subject: `Đơn hàng #${data.orderCode} đã được xác nhận`,
      html: `
        <h2>Xin chào ${data.buyerName}!</h2>
        <p>Đơn hàng <strong>#${data.orderCode}</strong> của bạn đã được xác nhận.</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
          <thead><tr><th>Sản phẩm</th><th>SL</th><th>Giá</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p><strong>Tổng tiền:</strong> ${data.total.toLocaleString('vi-VN')}đ</p>
        <p>Cảm ơn bạn đã mua sắm tại Shop HVNCLC!</p>
      `,
    });
  }

  async sendOrderShipped(to: string, data: { orderCode: string; trackingCode: string; carrier: string; buyerName: string }) {
    await this.send({
      to,
      subject: `Đơn hàng #${data.orderCode} đang được giao`,
      html: `
        <h2>Xin chào ${data.buyerName}!</h2>
        <p>Đơn hàng <strong>#${data.orderCode}</strong> đã được bàn giao cho đơn vị vận chuyển.</p>
        <p><strong>Đơn vị vận chuyển:</strong> ${data.carrier}</p>
        <p><strong>Mã vận đơn:</strong> ${data.trackingCode}</p>
        <p>Bạn có thể theo dõi đơn hàng trong ứng dụng.</p>
      `,
    });
  }

  async sendDisputeUpdate(to: string, data: { orderCode: string; status: string; message: string; buyerName: string }) {
    await this.send({
      to,
      subject: `Cập nhật tranh chấp đơn hàng #${data.orderCode}`,
      html: `
        <h2>Xin chào ${data.buyerName}!</h2>
        <p>Tranh chấp liên quan đến đơn hàng <strong>#${data.orderCode}</strong> đã được cập nhật.</p>
        <p><strong>Trạng thái:</strong> ${data.status}</p>
        <p><strong>Thông báo:</strong> ${data.message}</p>
      `,
    });
  }

  async sendWelcome(to: string, data: { name: string }) {
    await this.send({
      to,
      subject: 'Chào mừng đến với Shop HVNCLC!',
      html: `
        <h2>Xin chào ${data.name}!</h2>
        <p>Bạn đã đăng ký tài khoản thành công tại <strong>Shop HVNCLC</strong>.</p>
        <p>Hãy bắt đầu mua sắm ngay hôm nay và khám phá hàng nghìn sản phẩm chất lượng.</p>
        <p>Chúc bạn có trải nghiệm mua sắm tuyệt vời!</p>
      `,
    });
  }

  async sendPasswordReset(to: string, data: { name: string; resetLink: string }) {
    await this.send({
      to,
      subject: 'Đặt lại mật khẩu',
      html: `
        <h2>Xin chào ${data.name}!</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới:</p>
        <a href="${data.resetLink}" style="background:#e53e3e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Đặt lại mật khẩu</a>
        <p>Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
    });
  }
}

export const emailService = new EmailService();
