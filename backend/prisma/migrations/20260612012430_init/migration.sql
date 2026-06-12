-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SELLER_OWNER', 'SELLER_STAFF', 'ADMIN_OPERATOR', 'ADMIN_FINANCE', 'ADMIN_CONTENT', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'DEDUCTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'AWAITING_SELLER_CONFIRM', 'SELLER_CONFIRMED', 'PACKED', 'HANDED_TO_CARRIER', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNING', 'RETURNED', 'REFUNDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'ZALOPAY', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUNDED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PLATFORM_VOUCHER', 'SHOP_VOUCHER', 'PRODUCT_DISCOUNT', 'FLASH_SALE', 'COMBO', 'FREESHIP', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('GENERAL', 'FLASH_SALE', 'SEASONAL', 'CATEGORY_FOCUS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('ORDER_PAID', 'PLATFORM_FEE', 'SHIPPING_FEE', 'VOUCHER_SUBSIDY', 'REFUND', 'WITHDRAWAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('RETURN', 'REFUND_ONLY', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnRequestStatus" AS ENUM ('PENDING', 'SELLER_APPROVED', 'SELLER_REJECTED', 'ADMIN_REVIEWING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'SPEND', 'EXPIRE', 'ADJUST');

-- CreateEnum
CREATE TYPE "BulkImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "InboundStatus" AS ENUM ('PENDING', 'SCHEDULED', 'RECEIVED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'HANDED_OVER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdsType" AS ENUM ('SPONSORED_PRODUCT', 'BANNER', 'KEYWORD');

-- CreateEnum
CREATE TYPE "AdsCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'SELLER_RESPONDED', 'ADMIN_REVIEWING', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "avatar" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idNumber" TEXT,
    "idFront" TEXT,
    "idBack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "ward" TEXT,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'VN',
    "zipCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "status" "ShopStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "rejectionReason" TEXT,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "phone" TEXT,
    "email" TEXT,
    "addressLine" TEXT,
    "district" TEXT,
    "province" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_staffs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_staff_permissions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_staff_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_bank_accounts" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "branch" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_banners" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_collections" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_collection_products" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_collection_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_followers" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "weight" DECIMAL(10,3),
    "width" DECIMAL(10,2),
    "height" DECIMAL(10,2),
    "length" DECIMAL(10,2),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_groups" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_variant_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sku_variant_values" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "product_sku_variant_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "comparePrice" DECIMAL(15,2),
    "costPrice" DECIMAL(15,2),
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stocks" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "orderId" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingFee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "shippingAddressSnapshot" JSONB NOT NULL,
    "noteFromBuyer" TEXT,
    "cancelReason" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'buyer_web',
    "referralCode" TEXT,
    "affiliateClickId" TEXT,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "skuNameSnapshot" TEXT NOT NULL,
    "skuImageSnapshot" TEXT,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "finalPrice" DECIMAL(15,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_histories" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "actorType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "transactionRef" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "gatewayRef" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_fee_rules" (
    "id" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "fromProvince" TEXT,
    "toProvince" TEXT,
    "minWeight" DECIMAL(10,3),
    "maxWeight" DECIMAL(10,3),
    "baseFee" DECIMAL(15,2) NOT NULL,
    "extraFeePerKg" DECIMAL(15,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_carriers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrierId" TEXT,
    "trackingNumber" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "shippingFee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_orders" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "carrierResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_tracking_logs" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "type" "PromotionType" NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(15,2) NOT NULL,
    "minOrderAmount" DECIMAL(15,2),
    "maxDiscount" DECIMAL(15,2),
    "usageLimit" INTEGER,
    "usageLimitPerUser" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_rules" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleValue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_targets" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_redemptions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bannerUrl" TEXT,
    "type" "CampaignType" NOT NULL DEFAULT 'GENERAL',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_sellers" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_products" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_slots" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flash_sale_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_items" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "flashPrice" DECIMAL(15,2) NOT NULL,
    "quota" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flash_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_deals" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(15,2) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_deal_items" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "combo_deal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freeshipping_rules" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "name" TEXT NOT NULL,
    "minOrderAmount" DECIMAL(15,2),
    "maxDiscount" DECIMAL(15,2),
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freeshipping_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_votes" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isHelpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_wallets" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalReceived" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_ledger_entries" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "LedgerType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "payload" JSONB,
    "requestId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReturnType" NOT NULL DEFAULT 'RETURN',
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReturnRequestStatus" NOT NULL DEFAULT 'PENDING',
    "sellerNote" TEXT,
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_request_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,

    CONSTRAINT "return_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_evidences" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "RefundRequestStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_transactions" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_keywords" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_synonyms" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "keyword" TEXT,
    "campaignId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavior_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "orderId" TEXT,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_templates" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_import_jobs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'product',
    "status" "BulkImportStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorFileUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_import_job_rows" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rowData" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "errors" JSONB,

    CONSTRAINT "bulk_import_job_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "province" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stocks" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stock_movements" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_inbound_requests" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "InboundStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_inbound_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_outbound_requests" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "orderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_outbound_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_orders" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "pickedAt" TIMESTAMP(3),
    "packedAt" TIMESTAMP(3),
    "handedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_order_items" (
    "id" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_campaigns" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AdsType" NOT NULL DEFAULT 'SPONSORED_PRODUCT',
    "status" "AdsCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budget" DECIMAL(15,2) NOT NULL,
    "dailyBudget" DECIMAL(15,2),
    "spentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_ad_groups" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_ad_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_keywords" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "bidAmount" DECIMAL(15,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_impressions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT,
    "position" INTEGER,
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_clicks" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_conversions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "orderId" TEXT,
    "revenue" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_spend_logs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "spend" DECIMAL(15,2) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_spend_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_partners" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "shopId" TEXT,
    "productId" TEXT,
    "campaignId" TEXT,
    "code" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_conversions" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "commission" DECIMAL(15,2) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_commissions" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_payouts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_invites" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "rewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidences" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_decisions" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "deciderId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "threshold" DECIMAL(10,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_cases" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ruleId" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "description" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_events" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "riskValue" DECIMAL(10,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DECIMAL(10,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_score_histories" (
    "id" TEXT NOT NULL,
    "riskScoreId" TEXT NOT NULL,
    "score" DECIMAL(10,4) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_score_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rule_versions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_targets" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_execution_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segment_members" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_segment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_automation_flows" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_automation_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_automation_steps" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "delayMins" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_automation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_messages" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_message_logs" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "position" TEXT NOT NULL DEFAULT 'home_top',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_profiles_userId_key" ON "buyer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_userId_key" ON "seller_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shops_sellerProfileId_key" ON "shops"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "shop_followers_shopId_userId_key" ON "shop_followers"("shopId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_variant_values_skuId_optionId_key" ON "product_sku_variant_values"("skuId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "skus_skuCode_key" ON "skus"("skuCode");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stocks_skuId_key" ON "inventory_stocks"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "carts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_skuId_key" ON "cart_items"("cartId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON "wishlist_items"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_methods_code_key" ON "shipping_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_carriers_code_key" ON "shipping_carriers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "review_votes_reviewId_userId_key" ON "review_votes"("reviewId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_wallets_shopId_key" ON "seller_wallets"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_type_key" ON "notification_templates"("type");

-- CreateIndex
CREATE INDEX "event_logs_eventName_idx" ON "event_logs"("eventName");

-- CreateIndex
CREATE INDEX "event_logs_entityId_entityType_idx" ON "event_logs"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "event_logs_actorId_idx" ON "event_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_returnId_key" ON "refund_requests"("returnId");

-- CreateIndex
CREATE UNIQUE INDEX "search_keywords_keyword_key" ON "search_keywords"("keyword");

-- CreateIndex
CREATE INDEX "behavior_events_userId_eventType_idx" ON "behavior_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "behavior_events_productId_idx" ON "behavior_events"("productId");

-- CreateIndex
CREATE INDEX "behavior_events_eventType_createdAt_idx" ON "behavior_events"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_userId_key" ON "loyalty_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_buyerId_shopId_key" ON "chat_threads"("buyerId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stocks_warehouseId_skuId_key" ON "warehouse_stocks"("warehouseId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_partners_userId_key" ON "affiliate_partners"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_links_code_key" ON "affiliate_links"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_invites_inviteeId_key" ON "referral_invites"("inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "risk_scores_entityType_entityId_key" ON "risk_scores"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segment_members_segmentId_userId_key" ON "customer_segment_members"("segmentId", "userId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_staffs" ADD CONSTRAINT "shop_staffs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_staff_permissions" ADD CONSTRAINT "shop_staff_permissions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_bank_accounts" ADD CONSTRAINT "seller_bank_accounts_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_banners" ADD CONSTRAINT "shop_banners_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_collections" ADD CONSTRAINT "shop_collections_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_collection_products" ADD CONSTRAINT "shop_collection_products_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "shop_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_collection_products" ADD CONSTRAINT "shop_collection_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_followers" ADD CONSTRAINT "shop_followers_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_groups" ADD CONSTRAINT "product_variant_groups_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_variant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sku_variant_values" ADD CONSTRAINT "product_sku_variant_values_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sku_variant_values" ADD CONSTRAINT "product_sku_variant_values_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "product_variant_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skus" ADD CONSTRAINT "skus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "inventory_stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_fee_rules" ADD CONSTRAINT "shipping_fee_rules_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "shipping_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "shipping_carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_orders" ADD CONSTRAINT "shipping_orders_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "shipping_carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_tracking_logs" ADD CONSTRAINT "shipping_tracking_logs_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_targets" ADD CONSTRAINT "promotion_targets_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_sellers" ADD CONSTRAINT "campaign_sellers_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_sellers" ADD CONSTRAINT "campaign_sellers_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_slots" ADD CONSTRAINT "flash_sale_slots_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "flash_sale_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_deal_items" ADD CONSTRAINT "combo_deal_items_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "combo_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_deal_items" ADD CONSTRAINT "combo_deal_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_wallets" ADD CONSTRAINT "seller_wallets_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_ledger_entries" ADD CONSTRAINT "seller_ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "seller_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_ledger_entries" ADD CONSTRAINT "seller_ledger_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "seller_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_evidences" ADD CONSTRAINT "return_evidences_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "refund_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_histories" ADD CONSTRAINT "search_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_events" ADD CONSTRAINT "behavior_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_events" ADD CONSTRAINT "behavior_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_import_job_rows" ADD CONSTRAINT "bulk_import_job_rows_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "bulk_import_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock_movements" ADD CONSTRAINT "warehouse_stock_movements_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "warehouse_stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inbound_requests" ADD CONSTRAINT "warehouse_inbound_requests_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inbound_requests" ADD CONSTRAINT "warehouse_inbound_requests_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_outbound_requests" ADD CONSTRAINT "warehouse_outbound_requests_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_orders" ADD CONSTRAINT "fulfillment_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_order_items" ADD CONSTRAINT "fulfillment_order_items_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_campaigns" ADD CONSTRAINT "ads_campaigns_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_ad_groups" ADD CONSTRAINT "ads_ad_groups_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ads_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_keywords" ADD CONSTRAINT "ads_keywords_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ads_ad_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_impressions" ADD CONSTRAINT "ads_impressions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ads_ad_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_clicks" ADD CONSTRAINT "ads_clicks_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ads_ad_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_conversions" ADD CONSTRAINT "ads_conversions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ads_ad_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_spend_logs" ADD CONSTRAINT "ads_spend_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ads_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_partners" ADD CONSTRAINT "affiliate_partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "affiliate_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "affiliate_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "affiliate_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "affiliate_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "affiliate_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "referral_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "referral_invites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_decisions" ADD CONSTRAINT "dispute_decisions_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_score_histories" ADD CONSTRAINT "risk_score_histories_riskScoreId_fkey" FOREIGN KEY ("riskScoreId") REFERENCES "risk_scores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_rule_versions" ADD CONSTRAINT "policy_rule_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "policy_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_targets" ADD CONSTRAINT "policy_targets_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "policy_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_execution_logs" ADD CONSTRAINT "policy_execution_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "policy_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_segment_members" ADD CONSTRAINT "customer_segment_members_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "customer_segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_segment_members" ADD CONSTRAINT "customer_segment_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_automation_flows" ADD CONSTRAINT "marketing_automation_flows_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_automation_steps" ADD CONSTRAINT "marketing_automation_steps_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "marketing_automation_flows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_message_logs" ADD CONSTRAINT "marketing_message_logs_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "marketing_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_message_logs" ADD CONSTRAINT "marketing_message_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
