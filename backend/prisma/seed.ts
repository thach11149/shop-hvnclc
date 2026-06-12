import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create super admin
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.vn' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@marketplace.vn',
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      adminProfile: {
        create: { id: uuidv4(), fullName: 'Super Admin', department: 'Technology' },
      },
    },
  });
  console.log('Admin created:', admin.email);

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'dien-tu' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Điện tử',
      slug: 'dien-tu',
      description: 'Sản phẩm điện tử, công nghệ',
      position: 1,
      children: {
        create: [
          { id: uuidv4(), name: 'Điện thoại', slug: 'dien-thoai', position: 1 },
          { id: uuidv4(), name: 'Laptop', slug: 'laptop', position: 2 },
          { id: uuidv4(), name: 'Máy tính bảng', slug: 'may-tinh-bang', position: 3 },
        ],
      },
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'thoi-trang' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Thời trang',
      slug: 'thoi-trang',
      description: 'Quần áo, phụ kiện thời trang',
      position: 2,
      children: {
        create: [
          { id: uuidv4(), name: 'Áo', slug: 'ao', position: 1 },
          { id: uuidv4(), name: 'Quần', slug: 'quan', position: 2 },
          { id: uuidv4(), name: 'Giày dép', slug: 'giay-dep', position: 3 },
        ],
      },
    },
  });

  await prisma.category.upsert({
    where: { slug: 'gia-dung' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Gia dụng',
      slug: 'gia-dung',
      description: 'Đồ dùng gia đình',
      position: 3,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'lam-dep' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Làm đẹp',
      slug: 'lam-dep',
      description: 'Mỹ phẩm, chăm sóc sắc đẹp',
      position: 4,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'the-thao' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Thể thao',
      slug: 'the-thao',
      description: 'Dụng cụ thể thao, fitness',
      position: 5,
    },
  });

  console.log('Categories created');

  // Create shipping methods
  await prisma.shippingMethod.upsert({
    where: { code: 'standard' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Giao hàng tiêu chuẩn',
      code: 'standard',
      description: 'Giao hàng 3-5 ngày',
    },
  });

  await prisma.shippingMethod.upsert({
    where: { code: 'express' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Giao hàng nhanh',
      code: 'express',
      description: 'Giao hàng 1-2 ngày',
    },
  });

  // Create notification templates
  const templates = [
    { type: 'order_created', subject: 'Đơn hàng đã được tạo', bodyHtml: '<p>Đơn hàng {{orderNumber}} của bạn đã được tạo thành công.</p>', bodyText: 'Đơn hàng {{orderNumber}} của bạn đã được tạo thành công.' },
    { type: 'order_confirmed', subject: 'Đơn hàng đã được xác nhận', bodyHtml: '<p>Đơn hàng {{orderNumber}} đã được nhà bán xác nhận.</p>', bodyText: 'Đơn hàng {{orderNumber}} đã được nhà bán xác nhận.' },
    { type: 'product_approved', subject: 'Sản phẩm đã được duyệt', bodyHtml: '<p>Sản phẩm {{productName}} của bạn đã được phê duyệt.</p>', bodyText: 'Sản phẩm {{productName}} của bạn đã được phê duyệt.' },
    { type: 'seller_approved', subject: 'Shop đã được duyệt', bodyHtml: '<p>Shop {{shopName}} của bạn đã được phê duyệt. Bạn có thể bắt đầu đăng sản phẩm.</p>', bodyText: 'Shop {{shopName}} đã được phê duyệt.' },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { type: template.type },
      update: {},
      create: { id: uuidv4(), ...template },
    });
  }

  // Create demo banner
  await prisma.banner.create({
    data: {
      id: uuidv4(),
      title: 'Siêu Sale 11.11',
      imageUrl: 'https://via.placeholder.com/1200x400?text=Sale+11.11',
      link: '/campaigns/sale-1111',
      position: 'home_top',
      sortOrder: 1,
      isActive: true,
    },
  }).catch(() => {});

  // Create platform vouchers
  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      id: uuidv4(),
      type: 'PLATFORM_VOUCHER',
      code: 'WELCOME10',
      name: 'Chào mừng người dùng mới',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 100000,
      maxDiscount: 50000,
      usageLimitPerUser: 1,
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.promotion.upsert({
    where: { code: 'FREESHIP50K' },
    update: {},
    create: {
      id: uuidv4(),
      type: 'PLATFORM_VOUCHER',
      code: 'FREESHIP50K',
      name: 'Miễn phí vận chuyển',
      description: 'Miễn phí vận chuyển cho đơn từ 200k',
      discountType: 'FREE_SHIPPING',
      discountValue: 50000,
      minOrderAmount: 200000,
      usageLimit: 1000,
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create test buyer
  const buyerPassword = await bcrypt.hash('Buyer@123456', 12);
  await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'buyer@test.com',
      phone: '0901234567',
      passwordHash: buyerPassword,
      role: UserRole.BUYER,
      emailVerified: true,
      buyerProfile: {
        create: { id: uuidv4(), fullName: 'Người mua Test' },
      },
      cart: { create: { id: uuidv4() } },
      loyaltyAccount: { create: { id: uuidv4() } },
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin: admin@marketplace.vn / Admin@123456');
  console.log('Buyer: buyer@test.com / Buyer@123456');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
