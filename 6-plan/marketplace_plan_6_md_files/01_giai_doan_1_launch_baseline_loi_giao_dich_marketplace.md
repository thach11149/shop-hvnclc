# GIAI ĐOẠN 1: LAUNCH BASELINE – LÕI GIAO DỊCH MARKETPLACE

# 23. PLAN RIÊNG GIAI ĐOẠN 1  
## Launch Baseline – Xây lõi giao dịch marketplace

---

## 23.1. Mục tiêu sản phẩm của giai đoạn 1

Giai đoạn 1 nhằm tạo ra bản đầu tiên có thể vận hành thật.  
Chưa cần giống Shopee/Lazada đầy đủ, nhưng phải có đủ lõi của một sàn thương mại điện tử đa nhà bán.

Kết quả mong muốn:

```text
Người mua có thể:
- Đăng ký/đăng nhập.
- Xem sản phẩm.
- Tìm kiếm/lọc sản phẩm cơ bản.
- Thêm sản phẩm vào giỏ hàng.
- Đặt hàng.
- Theo dõi trạng thái đơn hàng.
- Đánh giá sản phẩm sau khi mua.

Nhà bán có thể:
- Đăng ký shop.
- Được admin duyệt.
- Đăng sản phẩm.
- Quản lý giá, tồn kho.
- Nhận và xử lý đơn hàng.
- Xem doanh thu cơ bản.

Admin có thể:
- Duyệt nhà bán.
- Duyệt sản phẩm.
- Quản lý danh mục.
- Theo dõi đơn hàng toàn sàn.
- Cấu hình phí sàn.
- Tạo voucher cơ bản.
- Xem báo cáo doanh thu cơ bản.
```

Giai đoạn này là nền móng. Nếu code sai ở giai đoạn này, các giai đoạn sau sẽ rất dễ bị vỡ hệ thống.

---

## 23.2. Phạm vi giai đoạn 1

### 23.2.1. Trong phạm vi

| Nhóm | Tính năng |
|---|---|
| Buyer | Đăng ký, đăng nhập, xem sản phẩm, tìm kiếm, giỏ hàng, checkout, lịch sử đơn, đánh giá |
| Seller | Đăng ký shop, hồ sơ shop, đăng sản phẩm, quản lý đơn, tồn kho, doanh thu |
| Admin | Duyệt seller, duyệt sản phẩm, quản lý danh mục, quản lý đơn, voucher cơ bản |
| Payment | COD, chuyển khoản hoặc payment gateway cơ bản |
| Shipping | Phí vận chuyển cơ bản, trạng thái giao hàng thủ công |
| Promotion | Voucher sàn, voucher shop, giảm giá sản phẩm |
| Finance | Tính doanh thu seller, phí sàn, ledger cơ bản |
| Data | Audit log, event log |
| Security | Auth, RBAC, phân quyền buyer/seller/admin |

### 23.2.2. Ngoài phạm vi

| Chưa làm ở giai đoạn 1 | Lý do |
|---|---|
| Livestream | Phức tạp, chưa cần cho launch |
| AI recommendation | Cần dữ liệu trước |
| Đấu thầu quảng cáo | Chỉ phù hợp khi có nhiều seller |
| Đổi trả nâng cao | Đưa sang giai đoạn 2 |
| Đa kho | Đưa sang giai đoạn 3 |
| Fulfillment by platform | Đưa sang giai đoạn 3 |
| Affiliate | Đưa sang giai đoạn 3 |
| Big Data/AI | Đưa sang giai đoạn 4 |

---

## 23.3. Luồng nghiệp vụ bắt buộc phải code

### 23.3.1. Luồng người mua đặt hàng

```text
1. Buyer đăng nhập.
2. Buyer xem danh sách sản phẩm.
3. Buyer xem chi tiết sản phẩm.
4. Buyer chọn SKU/số lượng.
5. Buyer thêm vào giỏ hàng.
6. Buyer vào checkout.
7. Hệ thống kiểm tra:
   - Sản phẩm còn active không?
   - SKU còn bán không?
   - Seller còn hoạt động không?
   - Còn tồn kho không?
   - Voucher có hợp lệ không?
8. Hệ thống tính:
   - Tổng tiền hàng.
   - Giảm giá sản phẩm.
   - Voucher shop.
   - Voucher sàn.
   - Phí vận chuyển.
   - Tổng thanh toán.
9. Buyer xác nhận đặt hàng.
10. Hệ thống tạo order.
11. Hệ thống giữ tồn kho.
12. Hệ thống tạo payment transaction.
13. Hệ thống ghi event order.created.
14. Hệ thống thông báo cho seller và buyer.
```

### 23.3.2. Luồng seller đăng sản phẩm

```text
1. Seller đăng nhập Seller Center.
2. Seller tạo sản phẩm.
3. Seller nhập:
   - Tên sản phẩm.
   - Danh mục.
   - Mô tả.
   - Hình ảnh.
   - Giá.
   - Tồn kho.
   - Trọng lượng/kích thước nếu có.
4. Sản phẩm ở trạng thái pending_approval.
5. Admin duyệt hoặc từ chối.
6. Nếu duyệt, sản phẩm chuyển sang approved + active.
7. Sản phẩm hiển thị cho người mua.
8. Ghi event product.approved.
```

### 23.3.3. Luồng seller xử lý đơn

```text
1. Seller nhận thông báo có đơn mới.
2. Seller vào danh sách đơn.
3. Seller xác nhận đơn.
4. Seller chuẩn bị hàng.
5. Seller cập nhật trạng thái đã đóng gói.
6. Seller bàn giao vận chuyển hoặc tự giao.
7. Buyer/admin theo dõi trạng thái.
8. Khi đơn hoàn tất, hệ thống ghi nhận doanh thu seller.
```

### 23.3.4. Luồng admin duyệt seller

```text
1. Seller gửi hồ sơ đăng ký.
2. Admin xem danh sách seller chờ duyệt.
3. Admin kiểm tra thông tin.
4. Admin approve/reject.
5. Nếu approve:
   - Shop được phép đăng sản phẩm.
   - Seller được quyền truy cập Seller Center.
6. Nếu reject:
   - Seller nhận lý do từ chối.
7. Ghi audit log.
```

---

## 23.4. Module cần code ở giai đoạn 1

### 23.4.1. Auth Module

Cần code:

```text
- Register buyer.
- Login buyer/seller/admin.
- Refresh token.
- Logout.
- Forgot password.
- Reset password.
- Hash password.
- JWT access token.
- JWT refresh token.
```

Role tối thiểu:

```text
buyer
seller_owner
seller_staff
admin_operator
admin_finance
admin_content
super_admin
```

Permission tối thiểu:

```text
product.create
product.update
product.approve
order.view_own
order.view_all
order.update_status
seller.approve
promotion.create
finance.view
admin.dashboard.view
```

### 23.4.2. User & Address Module

Cần code:

```text
- Buyer profile.
- Seller user profile.
- Admin user profile.
- Shipping address CRUD.
- Default address.
```

Bảng cần có:

```text
users
buyer_profiles
user_addresses
```

### 23.4.3. Seller & Shop Module

Cần code:

```text
- Seller registration.
- Shop profile.
- Shop approval.
- Shop status.
- Shop basic configuration.
- Seller bank account.
```

Bảng cần có:

```text
seller_profiles
shops
shop_staffs
seller_bank_accounts
```

Trạng thái shop:

```text
pending_approval
approved
rejected
suspended
closed
```

### 23.4.4. Catalog Module

Cần code:

```text
- Category CRUD.
- Product CRUD for seller.
- Product approval for admin.
- Product image upload.
- Product search basic.
- Product listing for buyer.
- Product detail page.
```

Bảng cần có:

```text
categories
products
product_images
product_attributes
skus
```

Trạng thái sản phẩm:

```text
draft
pending_approval
approved
rejected
active
inactive
suspended
deleted
```

### 23.4.5. Inventory Module

Cần code:

```text
- Create stock for SKU.
- Update stock.
- Reserve stock when order created.
- Release stock when order cancelled.
- Deduct stock when order confirmed/paid.
```

Bảng cần có:

```text
inventory_stocks
inventory_reservations
```

Logic quan trọng:

```text
available_quantity = total_quantity - reserved_quantity - sold_quantity
```

Không được trừ tồn kho trực tiếp ngay khi buyer thêm vào giỏ hàng.

### 23.4.6. Cart Module

Cần code:

```text
- Add item to cart.
- Update item quantity.
- Remove item.
- Clear cart after checkout.
- Validate cart before checkout.
```

Bảng cần có:

```text
carts
cart_items
```

### 23.4.7. Checkout Module

Cần code:

```text
- Checkout preview.
- Validate product/SKU/seller.
- Validate stock.
- Validate voucher.
- Calculate subtotal.
- Calculate discount.
- Calculate shipping fee.
- Calculate platform fee.
- Create order.
```

Service nên có:

```text
CheckoutService
CartValidationService
PriceCalculationService
PromotionApplyService
ShippingFeeService
OrderCreationService
InventoryReservationService
```

### 23.4.8. Order Module

Cần code:

```text
- Create order.
- List buyer orders.
- List seller orders.
- List admin orders.
- Order detail.
- Cancel order.
- Update seller processing status.
- Order status history.
```

Bảng cần có:

```text
orders
order_items
order_status_histories
```

State machine tối thiểu:

```text
pending_payment
awaiting_seller_confirm
seller_confirmed
packed
handed_to_carrier
shipping
delivered
completed
cancelled
```

### 23.4.9. Payment Module

Cần code:

```text
- Payment method COD.
- Payment method bank transfer/payment gateway nếu có.
- Payment transaction.
- Payment callback.
- Payment status update.
```

Bảng cần có:

```text
payments
payment_transactions
```

Trạng thái thanh toán:

```text
unpaid
pending
paid
failed
cancelled
refunded
partial_refunded
```

### 23.4.10. Shipping Module

Cần code:

```text
- Shipping method.
- Shipping fee rule.
- Shipping address snapshot.
- Manual shipment status.
```

Bảng cần có:

```text
shipping_methods
shipping_fee_rules
shipments
shipping_addresses
```

### 23.4.11. Promotion Module

Cần code:

```text
- Platform voucher.
- Shop voucher.
- Product discount.
- Usage limit.
- Usage limit per user.
- Start/end date.
- Minimum order amount.
```

Bảng cần có:

```text
promotions
promotion_rules
promotion_targets
promotion_redemptions
```

Không hard-code voucher. Phải dùng rule để sau này mở rộng.

### 23.4.12. Finance Module

Cần code:

```text
- Calculate seller receivable amount.
- Calculate platform commission.
- Create seller ledger entry.
- Seller revenue dashboard.
- Withdrawal request.
```

Bảng cần có:

```text
seller_wallets
seller_ledger_entries
withdrawal_requests
```

Ledger type:

```text
order_paid
platform_fee
shipping_fee
voucher_subsidy
refund
withdrawal
adjustment
```

### 23.4.13. Notification Module

Cần code:

```text
- Email order confirmation.
- Email seller new order.
- Notification product approved/rejected.
- Notification withdrawal status.
```

Bảng cần có:

```text
notifications
notification_templates
```

### 23.4.14. Admin Module

Cần code:

```text
- Dashboard.
- Manage users.
- Manage sellers.
- Approve/reject seller.
- Approve/reject product.
- Manage categories.
- Manage orders.
- Manage promotions.
- Manage banners.
- Basic reports.
```

---

## 23.5. API cần code ở giai đoạn 1

### Auth API

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Buyer API

```text
GET    /api/v1/categories
GET    /api/v1/products
GET    /api/v1/products/:id
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId
POST   /api/v1/checkout/preview
POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel
POST   /api/v1/reviews
```

### Seller API

```text
POST   /api/v1/seller/register
GET    /api/v1/seller/shop
PATCH  /api/v1/seller/shop
POST   /api/v1/seller/products
GET    /api/v1/seller/products
GET    /api/v1/seller/products/:id
PATCH  /api/v1/seller/products/:id
POST   /api/v1/seller/products/:id/submit-approval
GET    /api/v1/seller/orders
GET    /api/v1/seller/orders/:id
PATCH  /api/v1/seller/orders/:id/confirm
PATCH  /api/v1/seller/orders/:id/pack
GET    /api/v1/seller/finance/ledger
GET    /api/v1/seller/finance/summary
POST   /api/v1/seller/withdrawals
```

### Admin API

```text
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/status
GET    /api/v1/admin/sellers
GET    /api/v1/admin/sellers/:id
PATCH  /api/v1/admin/sellers/:id/approve
PATCH  /api/v1/admin/sellers/:id/reject
GET    /api/v1/admin/products/pending
PATCH  /api/v1/admin/products/:id/approve
PATCH  /api/v1/admin/products/:id/reject
GET    /api/v1/admin/orders
GET    /api/v1/admin/promotions
POST   /api/v1/admin/promotions
PATCH  /api/v1/admin/promotions/:id
GET    /api/v1/admin/reports/sales
```

---

## 23.6. UI page cần làm ở giai đoạn 1

### Buyer Web

```text
/
 /login
 /register
 /categories/:slug
 /products
 /products/:slug
 /cart
 /checkout
 /orders
 /orders/:id
 /account
 /account/addresses
 /wishlist
```

### Seller Center

```text
/seller/login
/seller/register
/seller/dashboard
/seller/shop
/seller/products
/seller/products/new
/seller/products/:id/edit
/seller/orders
/seller/orders/:id
/seller/finance
/seller/withdrawals
```

### Admin Console

```text
/admin/login
/admin/dashboard
/admin/users
/admin/sellers
/admin/sellers/:id
/admin/products/pending
/admin/categories
/admin/orders
/admin/promotions
/admin/banners
/admin/reports
```

---

## 23.7. Event cần phát sinh ở giai đoạn 1

```text
user.registered
user.logged_in
seller.registered
seller.approved
seller.rejected
product.created
product.submitted_for_approval
product.approved
product.rejected
cart.item_added
cart.item_removed
checkout.started
checkout.previewed
order.created
order.cancelled
payment.created
payment.paid
payment.failed
inventory.reserved
inventory.released
inventory.deducted
promotion.applied
promotion.redeemed
review.created
seller.ledger_created
withdrawal.requested
notification.sent
```

Các event này phải có cấu trúc chuẩn:

```text
event_id
event_name
actor_id
actor_type
entity_id
entity_type
payload_json
created_at
request_id
source
```

---

## 23.8. Tiêu chí nghiệm thu giai đoạn 1

Giai đoạn 1 chỉ được xem là hoàn thành khi:

```text
[ ] Buyer đăng ký/đăng nhập thành công.
[ ] Seller đăng ký shop thành công.
[ ] Admin duyệt seller được.
[ ] Seller đăng sản phẩm được.
[ ] Admin duyệt sản phẩm được.
[ ] Buyer tìm thấy sản phẩm đã duyệt.
[ ] Buyer thêm sản phẩm vào giỏ hàng được.
[ ] Buyer checkout và tạo đơn được.
[ ] Tồn kho được giữ khi tạo đơn.
[ ] Hủy đơn hoàn lại tồn kho.
[ ] Voucher được áp đúng điều kiện.
[ ] Order lưu đúng snapshot giá/sản phẩm/địa chỉ.
[ ] Seller thấy đơn thuộc shop mình.
[ ] Seller không thấy đơn của shop khác.
[ ] Admin thấy toàn bộ đơn.
[ ] Ledger seller phát sinh đúng sau đơn hoàn tất.
[ ] Có audit log cho thao tác admin.
[ ] Có event log cho order, payment, inventory, promotion.
[ ] API có phân quyền rõ.
[ ] Có test checkout, inventory, promotion, order state.
```

---

## 23.9. Lưu ý kỹ thuật chống xung đột cho giai đoạn sau

| Vấn đề | Cách làm đúng ở giai đoạn 1 |
|---|---|
| Sau này có biến thể sản phẩm | Tạo SKU riêng ngay từ đầu |
| Sau này có flash sale | Promotion phải có rule/target, không hard-code |
| Sau này có đổi trả | Order status phải có state machine mở rộng |
| Sau này có nhiều kho | Inventory không gắn cứng vào product, phải gắn SKU |
| Sau này có AI | Phải ghi event log từ đầu |
| Sau này có đối soát phức tạp | Phải có seller ledger |
| Sau này có app mobile | API phải version `/api/v1` |
| Sau này có phân quyền nhân viên shop | RBAC phải có seller_staff từ đầu |
| Sau này có search nâng cao | Product data phải có category, attributes, brand, SKU rõ |

---
