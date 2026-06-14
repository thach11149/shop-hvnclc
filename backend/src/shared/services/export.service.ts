import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

function escapeCsv(value: any): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

function buildCsv(headers: string[], rows: any[][]): string {
  const header = headers.map(escapeCsv).join(',');
  const body = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  return `${header}\n${body}`;
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv);
}

export class ExportService {
  constructor(private prisma: PrismaClient) {}

  async exportOrders(res: Response, filters: { from?: string; to?: string; shopId?: string; status?: string }) {
    const where: any = {};
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { user: { select: { email: true } }, items: { include: { sku: { include: { product: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const headers = ['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Email khách', 'Tổng tiền', 'Sản phẩm'];
    const rows = orders.map((o) => [
      o.code,
      o.createdAt.toISOString().slice(0, 10),
      o.status,
      o.user?.email || '',
      String(o.totalAmount),
      o.items.map((i) => `${i.sku?.product?.name || ''} x${i.quantity}`).join('; '),
    ]);

    sendCsv(res, `orders_${Date.now()}.csv`, buildCsv(headers, rows));
  }

  async exportProducts(res: Response, filters: { shopId?: string; status?: string; categoryId?: string }) {
    const where: any = {};
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        shop: { select: { name: true } },
        skus: { select: { price: true, stock: true } },
      },
      take: 10000,
    });

    const headers = ['ID', 'Tên sản phẩm', 'Danh mục', 'Shop', 'Trạng thái', 'Giá thấp nhất', 'Tổng tồn kho'];
    const rows = products.map((p) => [
      p.id,
      p.name,
      p.category?.name || '',
      p.shop?.name || '',
      p.status,
      String(Math.min(...p.skus.map((s) => Number(s.price)))),
      String(p.skus.reduce((sum, s) => sum + s.stock, 0)),
    ]);

    sendCsv(res, `products_${Date.now()}.csv`, buildCsv(headers, rows));
  }

  async exportFinance(res: Response, filters: { from?: string; to?: string; shopId?: string }) {
    const where: any = {};
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const orders = await this.prisma.order.findMany({
      where: { ...where, status: 'COMPLETED' },
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const headers = ['Mã đơn', 'Ngày hoàn thành', 'Shop', 'Doanh thu', 'Phí hoa hồng', 'Thực nhận'];
    const rows = orders.map((o) => {
      const total = Number(o.totalAmount);
      const commission = Number(o.commissionAmount || 0);
      return [
        o.code,
        o.updatedAt.toISOString().slice(0, 10),
        o.shop?.name || '',
        String(total),
        String(commission),
        String(total - commission),
      ];
    });

    sendCsv(res, `finance_${Date.now()}.csv`, buildCsv(headers, rows));
  }
}
