import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';
import { logger } from '../../shared/utils/logger';

// ============================================================
// VNPay helpers
// ============================================================

function vnpaySortObject(obj: Record<string, string>) {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((sorted, key) => {
      sorted[key] = obj[key];
      return sorted;
    }, {});
}

function vnpayCreateSignature(params: Record<string, string>, secretKey: string) {
  const sorted = vnpaySortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  return crypto.createHmac('sha512', secretKey).update(signData).digest('hex');
}

// ============================================================
// MoMo helpers
// ============================================================

function momoCreateSignature(rawSignature: string, secretKey: string) {
  return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
}

// ============================================================
// ZaloPay helpers
// ============================================================

function zaloBuildHmac(data: string, key: string) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

// ============================================================
// PaymentService
// ============================================================

export class PaymentService {
  private vnpayTmnCode = process.env.VNPAY_TMN_CODE || 'DEMO_TMN';
  private vnpayHashSecret = process.env.VNPAY_HASH_SECRET || 'DEMO_SECRET';
  private vnpayUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private vnpayReturnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return';

  private momoPartnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO_DEMO';
  private momoAccessKey = process.env.MOMO_ACCESS_KEY || 'DEMO_ACCESS';
  private momoSecretKey = process.env.MOMO_SECRET_KEY || 'DEMO_SECRET';
  private momoApiUrl = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
  private momoReturnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/momo-return';
  private momoNotifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3001/api/v1/payments/momo/callback';

  private zaloAppId = process.env.ZALO_APP_ID || 'ZALO_DEMO';
  private zaloKey1 = process.env.ZALO_KEY1 || 'DEMO_KEY1';
  private zaloKey2 = process.env.ZALO_KEY2 || 'DEMO_KEY2';
  private zaloApiUrl = process.env.ZALO_API_URL || 'https://sb-openapi.zalopay.vn/v2/create';
  private zaloCallbackUrl = process.env.ZALO_CALLBACK_URL || 'http://localhost:3001/api/v1/payments/zalopay/callback';

  constructor(private prisma: PrismaClient) {}

  async getPaymentByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { orderId },
      include: { transactions: true },
    });
  }

  // ============================================================
  // INITIATE PAYMENT
  // ============================================================

  async initiatePayment(orderId: string, userId: string, ipAddr?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.paymentStatus === PaymentStatus.PAID) throw new AppError('Order already paid', 400);

    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new AppError('Payment record not found', 404);

    switch (payment.method) {
      case PaymentMethod.VNPAY:
        return this.createVnpayUrl(payment.id, order.totalAmount.toNumber(), orderId, ipAddr);
      case PaymentMethod.MOMO:
        return this.createMomoPayment(payment.id, order.totalAmount.toNumber(), orderId);
      case PaymentMethod.ZALOPAY:
        return this.createZalopayOrder(payment.id, order.totalAmount.toNumber(), orderId, userId);
      case PaymentMethod.COD:
        return { method: 'COD', message: 'Pay on delivery' };
      case PaymentMethod.BANK_TRANSFER:
        return {
          method: 'BANK_TRANSFER',
          bankAccount: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
          bankName: process.env.BANK_NAME || 'Vietcombank',
          amount: order.totalAmount.toNumber(),
          note: `HVNCLC ${order.orderNumber}`,
        };
      default:
        throw new AppError('Unsupported payment method', 400);
    }
  }

  // ============================================================
  // VNPAY
  // ============================================================

  private createVnpayUrl(paymentId: string, amount: number, orderId: string, ipAddr = '127.0.0.1') {
    const now = new Date();
    const createDate = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000)
      .toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpayTmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(amount * 100)),
      vnp_ReturnUrl: this.vnpayReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const signature = vnpayCreateSignature(params, this.vnpayHashSecret);
    params.vnp_SecureHash = signature;

    const payUrl = `${this.vnpayUrl}?${new URLSearchParams(params).toString()}`;
    return { method: 'VNPAY', payUrl };
  }

  async handleVnpayReturn(query: Record<string, string>) {
    const secureHash = query.vnp_SecureHash;
    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const expectedHash = vnpayCreateSignature(params, this.vnpayHashSecret);
    if (secureHash !== expectedHash) {
      throw new AppError('Invalid signature', 400);
    }

    const paymentId = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;
    const transactionRef = query.vnp_TransactionNo;

    return this.updatePaymentStatus(
      paymentId,
      responseCode === '00' ? PaymentStatus.PAID : PaymentStatus.FAILED,
      transactionRef,
      query,
    );
  }

  // ============================================================
  // MOMO
  // ============================================================

  private async createMomoPayment(paymentId: string, amount: number, orderId: string) {
    const requestId = uuidv4();
    const orderInfo = `Thanh toan don hang ${orderId}`;
    const redirectUrl = this.momoReturnUrl;
    const ipnUrl = this.momoNotifyUrl;
    const requestType = 'payWithMethod';
    const extraData = '';

    const rawSignature = [
      `accessKey=${this.momoAccessKey}`,
      `amount=${Math.round(amount)}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${paymentId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${this.momoPartnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = momoCreateSignature(rawSignature, this.momoSecretKey);

    const body = {
      partnerCode: this.momoPartnerCode,
      accessKey: this.momoAccessKey,
      requestId,
      amount: Math.round(amount),
      orderId: paymentId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      extraData,
      signature,
      lang: 'vi',
    };

    try {
      const response = await fetch(this.momoApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { resultCode: number; payUrl?: string; message?: string };
      if (data.resultCode !== 0) {
        throw new AppError(`MoMo error: ${data.message}`, 400);
      }
      return { method: 'MOMO', payUrl: data.payUrl };
    } catch (err) {
      logger.error('MoMo payment creation failed', { err });
      throw new AppError('Payment gateway error', 502);
    }
  }

  async handleMomoCallback(body: Record<string, string | number>) {
    const { orderId, resultCode, transId, signature: receivedSig } = body as {
      orderId: string; resultCode: number; transId: string; signature: string;
    };

    const rawSignature = [
      `accessKey=${this.momoAccessKey}`,
      `amount=${body.amount}`,
      `extraData=${body.extraData}`,
      `message=${body.message}`,
      `orderId=${orderId}`,
      `orderInfo=${body.orderInfo}`,
      `orderType=${body.orderType}`,
      `partnerCode=${this.momoPartnerCode}`,
      `payType=${body.payType}`,
      `requestId=${body.requestId}`,
      `responseTime=${body.responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join('&');

    const expectedSig = momoCreateSignature(rawSignature, this.momoSecretKey);
    if (expectedSig !== receivedSig) throw new AppError('Invalid MoMo signature', 400);

    return this.updatePaymentStatus(
      orderId,
      resultCode === 0 ? PaymentStatus.PAID : PaymentStatus.FAILED,
      String(transId),
      body as unknown as Record<string, string>,
    );
  }

  // ============================================================
  // ZALOPAY
  // ============================================================

  private async createZalopayOrder(paymentId: string, amount: number, orderId: string, userId: string) {
    const transId = Math.floor(Math.random() * 1000000);
    const appTransId = `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}_${transId}`;
    const appTime = Date.now();

    const embedData = JSON.stringify({ redirecturl: `http://localhost:5173/payment/zalopay-return` });
    const items = JSON.stringify([{ itemid: orderId, itemname: 'HVNCLC Order', itemprice: Math.round(amount), itemquantity: 1 }]);

    const data = [
      this.zaloAppId,
      appTransId,
      userId,
      Math.round(amount),
      appTime,
      embedData,
      items,
    ].join('|');

    const mac = zaloBuildHmac(data, this.zaloKey1);

    const body = {
      app_id: this.zaloAppId,
      app_trans_id: appTransId,
      app_user: userId,
      app_time: appTime,
      amount: Math.round(amount),
      item: items,
      embed_data: embedData,
      description: `HVNCLC - Thanh toan don hang ${orderId}`,
      bank_code: '',
      callback_url: this.zaloCallbackUrl,
      mac,
    };

    try {
      const response = await fetch(this.zaloApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body as unknown as Record<string, string>).toString(),
      });
      const zdata = await response.json() as { return_code: number; order_url?: string; return_message?: string };
      if (zdata.return_code !== 1) throw new AppError(`ZaloPay error: ${zdata.return_message}`, 400);

      // store appTransId mapped to paymentId
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { transactionRef: appTransId },
      });

      return { method: 'ZALOPAY', payUrl: zdata.order_url };
    } catch (err) {
      logger.error('ZaloPay order creation failed', { err });
      throw new AppError('Payment gateway error', 502);
    }
  }

  async handleZalopayCallback(body: { data: string; mac: string }) {
    const { data: dataStr, mac } = body;
    const expectedMac = zaloBuildHmac(dataStr, this.zaloKey2);
    if (mac !== expectedMac) throw new AppError('Invalid ZaloPay MAC', 400);

    const data = JSON.parse(dataStr) as { app_trans_id: string; zp_trans_id: string; return_code: number };
    const payment = await this.prisma.payment.findFirst({ where: { transactionRef: data.app_trans_id } });
    if (!payment) throw new AppError('Payment not found', 404);

    return this.updatePaymentStatus(
      payment.id,
      data.return_code === 1 ? PaymentStatus.PAID : PaymentStatus.FAILED,
      String(data.zp_trans_id),
      { appTransId: data.app_trans_id },
    );
  }

  // ============================================================
  // SHARED UPDATE
  // ============================================================

  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    gatewayRef?: string,
    gatewayResponse?: Record<string, unknown>,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new AppError('Payment not found', 404);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionRef: gatewayRef,
        gatewayResponse: gatewayResponse ?? undefined,
        paidAt: status === PaymentStatus.PAID ? new Date() : undefined,
        failedAt: status === PaymentStatus.FAILED ? new Date() : undefined,
      },
    });

    if (status === PaymentStatus.PAID) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      await this.prisma.paymentTransaction.create({
        data: {
          id: uuidv4(),
          paymentId: payment.id,
          type: 'GATEWAY_PAYMENT',
          amount: payment.amount,
          status: PaymentStatus.PAID,
          gatewayRef: gatewayRef,
        },
      });

      await publishEvent({
        eventName: 'payment.paid',
        entityId: payment.orderId,
        entityType: 'order',
        payload: { paymentId, amount: payment.amount, method: payment.method },
      });
    } else if (status === PaymentStatus.FAILED) {
      await publishEvent({
        eventName: 'payment.failed',
        entityId: payment.orderId,
        entityType: 'order',
        payload: { paymentId, method: payment.method },
      });
    }

    return updatedPayment;
  }
}
