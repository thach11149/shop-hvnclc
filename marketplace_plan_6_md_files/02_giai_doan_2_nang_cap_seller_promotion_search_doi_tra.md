# GIAI ĐOẠN 2: NÂNG CẤP SELLER, PROMOTION, SEARCH, ĐỔI TRẢ

# 24. PLAN RIÊNG GIAI ĐOẠN 2  
## Growth Upgrade – Nâng cấp vận hành, seller, promotion, search, đổi trả

---

## 24.1. Mục tiêu sản phẩm của giai đoạn 2

Giai đoạn 2 giúp nền tảng từ “bán được hàng” chuyển sang “bán tốt hơn, vận hành tốt hơn, marketing tốt hơn”.

Kết quả mong muốn:

```text
Người mua:
- Tìm sản phẩm nhanh hơn.
- Lọc sản phẩm tốt hơn.
- Theo dõi giao hàng chi tiết hơn.
- Có thể yêu cầu đổi trả/hoàn tiền.
- Có thể follow shop.
- Có thể dùng nhiều loại khuyến mãi hơn.

Nhà bán:
- Đăng sản phẩm hàng loạt.
- Quản lý biến thể sản phẩm.
- Tạo combo, flash sale, freeship rule.
- Tham gia campaign toàn sàn.
- Quản lý đổi trả.
- Có báo cáo bán hàng tốt hơn.

Admin:
- Tạo campaign toàn sàn.
- Quản lý return/refund.
- Quản lý hãng vận chuyển.
- Xem báo cáo vận hành nâng cao.
```

---

## 24.2. Phạm vi giai đoạn 2

### 24.2.1. Trong phạm vi

| Nhóm | Tính năng |
|---|---|
| Product | Biến thể sản phẩm nâng cao, bulk import |
| Search | Autocomplete, filter nâng cao, sort nâng cao |
| Promotion | Flash sale, combo, freeship rule, voucher điều kiện |
| Campaign | Campaign toàn sàn, seller đăng ký sản phẩm tham gia |
| Return/Refund | Đổi trả/hoàn tiền cơ bản |
| Shipping | Tích hợp hãng vận chuyển, tracking log |
| Seller | Trang trí shop, nhân viên shop, báo cáo nâng cao |
| Buyer | Follow shop, hỏi đáp sản phẩm, notification cá nhân hóa |
| Loyalty | Điểm thưởng cơ bản |
| Analytics | Ghi hành vi view/click/search/add_to_cart |

### 24.2.2. Ngoài phạm vi

| Chưa làm | Lý do |
|---|---|
| Ads bidding | Đưa sang giai đoạn 3 |
| Fulfillment by platform | Đưa sang giai đoạn 3 |
| Đa kho | Đưa sang giai đoạn 3 |
| AI search đầy đủ | Đưa sang giai đoạn 4 |
| Recommendation phức tạp | Đưa sang giai đoạn 4 |
| Fraud ML | Đưa sang giai đoạn 4 |

---

## 24.3. Luồng nghiệp vụ cần code

### 24.3.1. Luồng seller upload sản phẩm hàng loạt

```text
1. Seller tải template Excel/CSV.
2. Seller nhập danh sách sản phẩm.
3. Seller upload file.
4. Hệ thống tạo bulk_import_job.
5. Hệ thống đọc từng dòng.
6. Hệ thống validate:
   - Danh mục có tồn tại không?
   - Giá có hợp lệ không?
   - SKU có trùng không?
   - Tồn kho có hợp lệ không?
   - Hình ảnh có đúng định dạng không?
7. Dòng hợp lệ được tạo sản phẩm ở trạng thái draft/pending_approval.
8. Dòng lỗi được ghi vào bulk_import_job_rows.
9. Seller tải file lỗi về để sửa.
```

### 24.3.2. Luồng flash sale

```text
1. Admin tạo khung giờ flash sale.
2. Seller đăng ký SKU tham gia.
3. Admin duyệt SKU tham gia.
4. Hệ thống lưu flash_sale_item:
   - SKU.
   - Giá flash sale.
   - Số lượng giới hạn.
   - Thời gian bắt đầu/kết thúc.
5. Khi buyer mua:
   - Kiểm tra flash sale đang active.
   - Kiểm tra còn quota.
   - Giữ quota flash sale.
   - Giữ tồn kho SKU.
6. Khi đơn hủy:
   - Hoàn quota nếu chính sách cho phép.
   - Hoàn tồn kho.
```

### 24.3.3. Luồng đổi trả/hoàn tiền

```text
1. Buyer vào đơn đã giao.
2. Buyer tạo yêu cầu đổi trả/hoàn tiền.
3. Buyer chọn lý do và upload ảnh/video.
4. Hệ thống tạo return_request.
5. Seller nhận yêu cầu.
6. Seller đồng ý hoặc từ chối.
7. Nếu seller đồng ý:
   - Buyer gửi hàng trả.
   - Seller/admin xác nhận nhận hàng.
   - Hệ thống tạo refund_request.
8. Payment module xử lý hoàn tiền.
9. Inventory module hoàn kho nếu hàng có thể bán lại.
10. Finance module ghi ledger refund.
```

### 24.3.4. Luồng campaign toàn sàn

```text
1. Admin tạo campaign.
2. Admin cấu hình:
   - Thời gian.
   - Banner.
   - Danh mục áp dụng.
   - Loại khuyến mãi.
   - Điều kiện seller tham gia.
3. Seller đăng ký sản phẩm tham gia.
4. Admin duyệt hoặc từ chối.
5. Sản phẩm được hiển thị trên landing page campaign.
6. Buyer mua trong thời gian campaign.
7. Hệ thống ghi nhận doanh thu theo campaign.
```

---

## 24.4. Module cần code ở giai đoạn 2

### 24.4.1. Product Variant Module

Cần code:

```text
- Variant group: màu sắc, kích thước, dung lượng.
- Variant option: đỏ, xanh, size M, size L.
- Map SKU với variant option.
- UI chọn biến thể trên trang chi tiết sản phẩm.
- Seller quản lý tồn kho/giá theo từng SKU biến thể.
```

Bảng cần thêm:

```text
product_variant_groups
product_variant_options
product_sku_variant_values
```

### 24.4.2. Bulk Import Module

Cần code:

```text
- Download template.
- Upload Excel/CSV.
- Validate file.
- Process async bằng queue.
- Ghi lỗi từng dòng.
- Cho seller tải kết quả import.
```

Bảng cần thêm:

```text
bulk_import_jobs
bulk_import_job_rows
```

### 24.4.3. Search Module V2

Cần code:

```text
- Autocomplete.
- Search suggestion.
- Search history.
- Filter nâng cao.
- Sort theo bán chạy, giá, mới nhất, đánh giá.
- Synonym cơ bản.
```

Bảng cần thêm:

```text
search_keywords
search_synonyms
search_histories
```

Nếu dữ liệu chưa lớn, có thể dùng PostgreSQL full-text.  
Nếu dữ liệu nhiều, chuẩn bị chuyển sang OpenSearch/Elasticsearch.

### 24.4.4. Promotion Engine V2

Cần code:

```text
- Flash sale.
- Combo deal.
- Bundle deal.
- Freeship rule.
- Voucher theo danh mục.
- Voucher theo user segment cơ bản.
- Usage limit realtime.
```

Bảng cần thêm:

```text
campaigns
campaign_products
campaign_sellers
flash_sale_slots
flash_sale_items
combo_deals
combo_deal_items
bundle_deals
freeship_rules
```

Lưu ý: không xóa module Promotion V1.  
Promotion V2 phải kế thừa rule cũ.

### 24.4.5. Return/Refund Module

Cần code:

```text
- Buyer tạo return request.
- Seller phản hồi.
- Admin can thiệp nếu tranh chấp.
- Refund transaction.
- Refund ledger.
- Return stock processing.
```

Bảng cần thêm:

```text
return_requests
return_request_items
refund_requests
refund_transactions
```

### 24.4.6. Shipping Integration Module

Cần code:

```text
- Shipping carrier configuration.
- Create shipping order.
- Get tracking status.
- Webhook tracking callback.
- Shipping tracking history.
```

Bảng cần thêm:

```text
shipping_carriers
shipping_orders
shipping_tracking_logs
```

### 24.4.7. Seller Enhancement Module

Cần code:

```text
- Shop decoration.
- Shop banner.
- Shop collection.
- Shop follower.
- Seller staff permissions.
```

Bảng cần thêm:

```text
shop_banners
shop_collections
shop_followers
shop_staff_permissions
```

### 24.4.8. Chat V2 Module

Cần code:

```text
- Chat thread.
- Chat message.
- Quick reply.
- Chat template.
- Mark read/unread.
```

Bảng cần thêm:

```text
chat_threads
chat_messages
chat_templates
```

### 24.4.9. Loyalty Lite Module

Cần code:

```text
- Loyalty account.
- Earn point when order completed.
- Use point for discount.
- Point transaction history.
```

Bảng cần thêm:

```text
loyalty_accounts
loyalty_transactions
```

### 24.4.10. Behavior Tracking Module

Cần code:

```text
- Track product view.
- Track search.
- Track add to cart.
- Track checkout.
- Track purchase.
- Track campaign click.
```

Bảng cần thêm:

```text
behavior_events
```

---

## 24.5. API cần code ở giai đoạn 2

### Product Variant & Import API

```text
POST   /api/v1/seller/products/:id/variant-groups
POST   /api/v1/seller/products/:id/variant-options
POST   /api/v1/seller/products/import
GET    /api/v1/seller/products/import-template
GET    /api/v1/seller/import-jobs/:id
GET    /api/v1/seller/import-jobs/:id/errors
```

### Search API

```text
GET    /api/v1/search
GET    /api/v1/search/suggestions
GET    /api/v1/search/histories
DELETE /api/v1/search/histories
```

### Promotion/Campaign API

```text
GET    /api/v1/campaigns
GET    /api/v1/campaigns/:id
POST   /api/v1/admin/campaigns
PATCH  /api/v1/admin/campaigns/:id
POST   /api/v1/seller/campaigns/:id/register
GET    /api/v1/seller/campaigns

POST   /api/v1/admin/flash-sale-slots
POST   /api/v1/seller/flash-sale-items
PATCH  /api/v1/admin/flash-sale-items/:id/approve

POST   /api/v1/seller/combo-deals
POST   /api/v1/seller/freeship-rules
```

### Return/Refund API

```text
POST   /api/v1/orders/:id/return-requests
GET    /api/v1/return-requests/:id
GET    /api/v1/seller/return-requests
PATCH  /api/v1/seller/return-requests/:id/approve
PATCH  /api/v1/seller/return-requests/:id/reject
GET    /api/v1/admin/return-requests
PATCH  /api/v1/admin/return-requests/:id/resolve
```

### Shipping API

```text
GET    /api/v1/shipping/carriers
POST   /api/v1/seller/orders/:id/create-shipping-order
GET    /api/v1/orders/:id/tracking
POST   /api/v1/webhooks/shipping/:carrierCode
```

### Behavior Tracking API

```text
POST   /api/v1/events/track
POST   /api/v1/events/batch-track
```

---

## 24.6. UI page cần làm ở giai đoạn 2

### Buyer Web

```text
/search
/campaigns/:slug
/shops/:slug
/shops/:slug/collections/:id
/orders/:id/return
/account/loyalty
```

### Seller Center

```text
/seller/products/import
/seller/products/:id/variants
/seller/campaigns
/seller/flash-sale
/seller/combo-deals
/seller/freeship-rules
/seller/return-requests
/seller/shop-decoration
/seller/chat
/seller/staffs
/seller/reports
```

### Admin Console

```text
/admin/campaigns
/admin/campaigns/:id
/admin/flash-sale
/admin/return-requests
/admin/shipping-carriers
/admin/search-config
/admin/reports/operations
```

---

## 24.7. Event cần phát sinh ở giai đoạn 2

```text
product.import_started
product.import_completed
product.import_failed
product.variant_created
search.performed
search.suggestion_clicked
campaign.created
campaign.seller_registered
campaign.product_approved
flash_sale.item_registered
flash_sale.item_sold
combo.created
freeship_rule.created
return.requested
return.approved
return.rejected
refund.requested
refund.completed
shipping_order.created
shipping.tracking_updated
shop.followed
chat.message_sent
loyalty.point_earned
loyalty.point_redeemed
behavior.product_viewed
behavior.add_to_cart
behavior.checkout_started
```

---

## 24.8. Tiêu chí nghiệm thu giai đoạn 2

```text
[ ] Seller tạo được sản phẩm có nhiều biến thể.
[ ] Buyer chọn đúng biến thể và giá/tồn kho tương ứng.
[ ] Seller upload Excel/CSV sản phẩm được.
[ ] File import lỗi không làm hỏng toàn bộ job.
[ ] Search có autocomplete.
[ ] Filter nâng cao hoạt động đúng.
[ ] Flash sale giới hạn số lượng chính xác.
[ ] Combo tính giá đúng.
[ ] Freeship áp đúng điều kiện.
[ ] Campaign toàn sàn hoạt động.
[ ] Seller đăng ký campaign được.
[ ] Buyer tạo yêu cầu đổi trả được.
[ ] Seller/admin xử lý đổi trả được.
[ ] Refund ghi đúng payment/refund/ledger.
[ ] Shipping carrier nhận đơn được.
[ ] Tracking log cập nhật đúng.
[ ] Follow shop hoạt động.
[ ] Chat V2 hoạt động.
[ ] Loyalty point cộng/trừ đúng.
[ ] Behavior event được ghi đầy đủ.
```

---

## 24.9. Lưu ý kỹ thuật chống xung đột cho giai đoạn 3 và 4

| Vấn đề | Cách làm ở giai đoạn 2 |
|---|---|
| Sau này cần AI recommendation | Track behavior_events đầy đủ |
| Sau này cần AI search | Lưu search log, keyword, click product |
| Sau này cần ads bidding | Campaign/promotion không được trộn với ads |
| Sau này cần fraud detection | Ghi return/refund/cancel/shipping event rõ |
| Sau này cần affiliate | Order phải có source/channel/referral fields |
| Sau này cần data warehouse | Event payload phải chuẩn schema |
| Sau này cần logistics orchestration | Shipping carrier phải là bảng riêng, không hard-code |
| Sau này cần multi-warehouse | Inventory module không được gắn cứng một kho |

---
