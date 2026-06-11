import { PrismaClient, ProductStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/utils/response';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';
import { publishEvent, publishAuditLog } from '../../shared/events/event-publisher';

export class CatalogService {
  constructor(private prisma: PrismaClient) {}

  // ---- CATEGORIES ----
  async getCategories(parentId?: string) {
    return this.prisma.category.findMany({
      where: { parentId: parentId || null, isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { position: 'asc' },
    });
  }

  async getCategoryBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({ where: { slug } });
    if (!cat) throw new AppError('Category not found', 404);
    return cat;
  }

  async createCategory(data: {
    name: string;
    slug: string;
    parentId?: string;
    description?: string;
    image?: string;
    position?: number;
  }, actorId: string) {
    const category = await this.prisma.category.create({
      data: { id: uuidv4(), ...data },
    });
    await publishAuditLog({ actorId, actorType: 'admin', action: 'create', entityType: 'category', entityId: category.id, newValue: data });
    return category;
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string; image: string; position: number; isActive: boolean }>, actorId: string) {
    const old = await this.prisma.category.findUnique({ where: { id } });
    if (!old) throw new AppError('Category not found', 404);
    const updated = await this.prisma.category.update({ where: { id }, data });
    await publishAuditLog({ actorId, actorType: 'admin', action: 'update', entityType: 'category', entityId: id, oldValue: old, newValue: data });
    return updated;
  }

  // ---- PRODUCTS (BUYER) ----
  async getProducts(query: {
    categoryId?: string;
    shopId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = getPaginationParams(query);

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.shopId && { shopId: query.shopId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { brand: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.minPrice || query.maxPrice ? {
        skus: {
          some: {
            isActive: true,
            price: {
              ...(query.minPrice && { gte: query.minPrice }),
              ...(query.maxPrice && { lte: query.maxPrice }),
            },
          },
        },
      } : {}),
    };

    const orderBy = this.getProductOrderBy(query.sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { take: 1, orderBy: { position: 'asc' } },
          skus: { where: { isActive: true }, take: 1 },
          shop: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginatedResult(products, total, page, limit);
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE },
      include: {
        images: { orderBy: { position: 'asc' } },
        attributes: true,
        skus: {
          where: { isActive: true },
          include: {
            variantValues: {
              include: { option: { include: { group: true } } },
            },
            inventoryStock: { select: { totalQuantity: true, reservedQuantity: true, soldQuantity: true } },
          },
        },
        variantGroups: {
          include: { options: { orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
        shop: { select: { id: true, name: true, slug: true, logo: true } },
        category: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, buyerProfile: { select: { fullName: true, avatar: true } } } }, images: true },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  // ---- PRODUCTS (SELLER) ----
  async getSellerProducts(shopId: string, query: { status?: ProductStatus; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Prisma.ProductWhereInput = {
      shopId,
      ...(query.status && { status: query.status }),
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { images: { take: 1 }, skus: { where: { isActive: true } }, category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginatedResult(products, total, page, limit);
  }

  async createProduct(shopId: string, data: {
    name: string;
    categoryId: string;
    description?: string;
    brand?: string;
    weight?: number;
    images?: string[];
    attributes?: { name: string; value: string }[];
    skus: { skuCode: string; name: string; price: number; comparePrice?: number; stock: number; image?: string }[];
  }) {
    const slug = this.generateSlug(data.name) + '-' + uuidv4().slice(0, 6);
    const product = await this.prisma.product.create({
      data: {
        id: uuidv4(),
        shopId,
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        brand: data.brand,
        weight: data.weight,
        status: ProductStatus.DRAFT,
        images: {
          create: (data.images || []).map((url, i) => ({ id: uuidv4(), url, position: i })),
        },
        attributes: {
          create: (data.attributes || []).map(a => ({ id: uuidv4(), ...a })),
        },
        skus: {
          create: data.skus.map(sku => ({
            id: uuidv4(),
            skuCode: sku.skuCode || uuidv4().slice(0, 8).toUpperCase(),
            name: sku.name,
            price: sku.price,
            comparePrice: sku.comparePrice,
            image: sku.image,
            inventoryStock: {
              create: { id: uuidv4(), totalQuantity: sku.stock },
            },
          })),
        },
      },
      include: { skus: true, images: true },
    });

    await publishEvent({
      eventName: 'product.created',
      actorId: shopId,
      actorType: 'shop',
      entityId: product.id,
      entityType: 'product',
      source: 'seller_center',
    });

    return product;
  }

  async updateProduct(productId: string, shopId: string, data: Partial<{
    name: string;
    description: string;
    brand: string;
    categoryId: string;
    weight: number;
  }>) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new AppError('Product not found', 404);

    return this.prisma.product.update({ where: { id: productId }, data });
  }

  async submitForApproval(productId: string, shopId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new AppError('Product not found', 404);
    if (product.status !== ProductStatus.DRAFT && product.status !== ProductStatus.REJECTED) {
      throw new AppError('Only draft or rejected products can be submitted', 400);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.PENDING_APPROVAL },
    });

    await publishEvent({
      eventName: 'product.submitted_for_approval',
      entityId: productId,
      entityType: 'product',
      source: 'seller_center',
    });

    return updated;
  }

  // ---- ADMIN ----
  async getPendingProducts(query: { page?: number; limit?: number }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Prisma.ProductWhereInput = { status: ProductStatus.PENDING_APPROVAL };
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { shop: true, category: true, images: { take: 1 } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return buildPaginatedResult(products, total, page, limit);
  }

  async approveProduct(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ACTIVE, approvedAt: new Date(), approvedBy: adminId },
    });

    await publishEvent({ eventName: 'product.approved', entityId: productId, entityType: 'product', actorId: adminId, actorType: 'admin' });
    await publishAuditLog({ actorId: adminId, actorType: 'admin', action: 'approve', entityType: 'product', entityId: productId });

    return updated;
  }

  async rejectProduct(productId: string, adminId: string, reason: string) {
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.REJECTED, rejectionReason: reason },
    });

    await publishEvent({ eventName: 'product.rejected', entityId: productId, entityType: 'product', actorId: adminId, actorType: 'admin', payload: { reason } });
    await publishAuditLog({ actorId: adminId, actorType: 'admin', action: 'reject', entityType: 'product', entityId: productId, newValue: { reason } });

    return updated;
  }

  private getProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc': return { skus: { _count: 'asc' } };
      case 'price_desc': return { skus: { _count: 'desc' } };
      case 'newest': return { createdAt: 'desc' };
      default: return { createdAt: 'desc' };
    }
  }

  private generateSlug(name: string) {
    return name.toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
