# CHECKLIST TRIỂN KHAI VÀ NGHIỆM THU CODE  
## Website thương mại điện tử đa nhà bán

File này dùng cho **Project Manager, Technical Lead, Developer, QA/Tester và Product Owner** để kiểm tra rõ:

```text
- Cần hiểu gì trước khi code?
- Cần làm gì ở từng giai đoạn?
- Cần code module nào?
- Cần có API nào?
- Cần có database/table nào?
- Cần phát sinh event nào?
- Cần test những gì?
- Khi nào được xem là hoàn thành?
```

Nguyên tắc kiểm tra:

```text
Một tính năng chỉ được xem là xong khi có:
- UI.
- API.
- Database migration.
- Validation.
- Permission/RBAC.
- Audit log nếu có thao tác quan trọng.
- Event log nếu là nghiệp vụ quan trọng.
- Unit test.
- Integration test nếu liên quan nhiều module.
- Tài liệu API/module.
- Không làm hỏng nghiệp vụ giai đoạn trước.
```

---

## 19. Checklist giai đoạn 1

```text
[ ] Buyer có thể đăng ký/đăng nhập
[ ] Seller có thể đăng ký shop
[ ] Admin có thể duyệt seller
[ ] Seller có thể đăng sản phẩm
[ ] Admin có thể duyệt sản phẩm
[ ] Buyer có thể tìm sản phẩm
[ ] Buyer có thể thêm vào giỏ hàng
[ ] Buyer có thể checkout
[ ] Hệ thống tạo order đúng
[ ] Hệ thống giữ tồn kho khi tạo order
[ ] Hệ thống áp voucher đúng
[ ] Hệ thống tính phí sàn đúng
[ ] Seller thấy đơn hàng
[ ] Admin thấy toàn bộ đơn hàng
[ ] Buyer theo dõi trạng thái đơn
[ ] Seller có ledger doanh thu
[ ] Có event log cho order/payment/inventory
[ ] Có audit log cho thao tác admin/seller
[ ] Có unit test cho checkout/order/inventory/promotion
```

---

## 20. Checklist giai đoạn 2

```text
[ ] Sản phẩm có biến thể/SKU nâng cao
[ ] Seller upload sản phẩm bằng Excel/CSV
[ ] Search có autocomplete
[ ] Filter nâng cao hoạt động đúng
[ ] Flash sale giới hạn số lượng đúng
[ ] Combo/freeship/voucher điều kiện hoạt động đúng
[ ] Người mua tạo return/refund request
[ ] Seller/admin xử lý return/refund
[ ] Kết nối hãng vận chuyển
[ ] Tracking đơn hàng chi tiết
[ ] Follow shop hoạt động
[ ] Chat nâng cấp hoạt động
[ ] Có loyalty point cơ bản
[ ] Có behavior event tracking
```

---

## 21. Checklist giai đoạn 3

```text
[ ] Quản lý đa kho
[ ] Fulfillment by platform
[ ] Ads service tính impression/click đúng
[ ] Ads không tính phí click trùng bất thường
[ ] Affiliate tracking đúng
[ ] Đơn hủy không phát sinh hoa hồng
[ ] Dispute center có workflow rõ
[ ] Fraud/risk scoring hoạt động
[ ] Policy engine áp rule đúng
[ ] Data warehouse nhận dữ liệu
[ ] BI dashboard khớp dữ liệu giao dịch
```

---

## 22. Checklist giai đoạn 4

```text
[ ] Có data pipeline ổn định
[ ] Có recommendation engine
[ ] Có AI search
[ ] Có AI shopping assistant
[ ] Có AI seller assistant
[ ] Có review summary
[ ] Có demand forecasting
[ ] Có fraud ML
[ ] Có marketing automation
[ ] Có monitoring chất lượng model AI
[ ] Có cơ chế kiểm soát dữ liệu riêng tư
```

---

## 34. Bản tóm tắt cho Tester/QA

Tester cần tập trung vào các luồng có rủi ro cao:

```text
1. Đặt hàng khi tồn kho ít.
2. Hai người cùng mua một SKU số lượng cuối.
3. Áp voucher hết lượt.
4. Hủy đơn sau khi đã giữ tồn kho.
5. Hủy đơn sau khi đã thanh toán.
6. Seller cố xem đơn của shop khác.
7. Buyer cố xem đơn của buyer khác.
8. Admin phân quyền thấp cố duyệt seller.
9. Seller sửa giá sau khi buyer đã đặt hàng.
10. Hoàn tiền một phần.
11. Đổi trả sau khi đơn completed.
12. Flash sale hết quota.
13. Affiliate order bị hủy.
14. Ads click trùng.
15. AI gợi ý sản phẩm đã hết hàng.
```

---

---

# CHECKLIST THEO NHÓM CÔNG VIỆC

## 1. Checklist thông tin cần hiểu trước khi code

```text
[ ] Hiểu đây là marketplace đa nhà bán, không phải website bán hàng một chủ.
[ ] Hiểu buyer, seller, admin là 3 nhóm người dùng khác nhau.
[ ] Hiểu mỗi seller có shop riêng.
[ ] Hiểu một giỏ hàng có thể có sản phẩm từ nhiều shop.
[ ] Hiểu đơn hàng cần tách theo shop nếu checkout nhiều shop.
[ ] Hiểu sản phẩm cần có SKU để phục vụ biến thể.
[ ] Hiểu tồn kho phải quản lý theo SKU, không chỉ theo product.
[ ] Hiểu giá, voucher, địa chỉ, sản phẩm phải lưu snapshot tại thời điểm mua.
[ ] Hiểu dòng tiền seller phải ghi ledger.
[ ] Hiểu mọi nghiệp vụ quan trọng phải có event log.
[ ] Hiểu mọi thao tác quản trị quan trọng phải có audit log.
[ ] Hiểu API phải có version ngay từ đầu.
[ ] Hiểu promotion cần thiết kế mở rộng bằng rule engine.
[ ] Hiểu order status phải là state machine.
[ ] Hiểu giai đoạn 1 phải tạo dữ liệu nền cho AI/Big Data giai đoạn 4.
```

## 2. Checklist module cần code

```text
[ ] Auth & RBAC.
[ ] User profile & address.
[ ] Seller/shop.
[ ] Catalog/category/product.
[ ] SKU/product variant.
[ ] Inventory.
[ ] Cart.
[ ] Checkout.
[ ] Order.
[ ] Payment.
[ ] Shipping.
[ ] Promotion.
[ ] Review.
[ ] Notification.
[ ] Finance/ledger.
[ ] Admin console.
[ ] Support/return/refund.
[ ] Search.
[ ] Campaign.
[ ] Analytics/event tracking.
[ ] Fraud/risk.
[ ] Ads.
[ ] Affiliate/referral.
[ ] Warehouse/fulfillment.
[ ] AI/Data.
```

## 3. Checklist API cần có

```text
[ ] Auth API.
[ ] Buyer product/category/search API.
[ ] Cart API.
[ ] Checkout API.
[ ] Order API.
[ ] Review API.
[ ] Seller registration/shop API.
[ ] Seller product/SKU/inventory API.
[ ] Seller order API.
[ ] Seller finance/withdrawal API.
[ ] Admin dashboard API.
[ ] Admin user/seller/product approval API.
[ ] Admin order API.
[ ] Promotion/campaign API.
[ ] Return/refund API.
[ ] Shipping/tracking API.
[ ] Event tracking API.
[ ] Ads API.
[ ] Affiliate/referral API.
[ ] Warehouse/fulfillment API.
[ ] AI/recommendation/search/chat API.
```

## 4. Checklist database/table cần có

```text
[ ] users, roles, permissions, user_roles.
[ ] buyer_profiles, user_addresses.
[ ] seller_profiles, shops, shop_staffs.
[ ] categories, products, product_images, product_attributes.
[ ] skus, sku_prices.
[ ] inventory_stocks, inventory_reservations.
[ ] carts, cart_items.
[ ] orders, order_items, order_status_histories.
[ ] payments, payment_transactions.
[ ] shipments, shipping_methods, shipping_fee_rules.
[ ] promotions, promotion_rules, promotion_targets, promotion_redemptions.
[ ] reviews, review_images.
[ ] notifications, notification_templates.
[ ] seller_wallets, seller_ledger_entries, withdrawal_requests.
[ ] support_tickets.
[ ] event_logs, audit_logs.
[ ] product_variant_groups, product_variant_options, product_sku_variant_values.
[ ] campaigns, flash_sale_slots, flash_sale_items.
[ ] combo_deals, freeship_rules.
[ ] return_requests, refund_requests, refund_transactions.
[ ] shipping_carriers, shipping_orders, shipping_tracking_logs.
[ ] behavior_events.
[ ] warehouses, warehouse_stocks, warehouse_stock_movements.
[ ] ads_campaigns, ads_keywords, ads_clicks, ads_conversions.
[ ] affiliate_partners, affiliate_links, affiliate_conversions.
[ ] fraud_rules, fraud_cases, risk_scores.
[ ] fact/dim tables hoặc data warehouse khi sang giai đoạn 3-4.
```

## 5. Checklist event cần phát sinh

```text
[ ] user.registered.
[ ] seller.registered.
[ ] seller.approved.
[ ] product.created.
[ ] product.approved.
[ ] cart.item_added.
[ ] checkout.started.
[ ] order.created.
[ ] order.cancelled.
[ ] payment.created.
[ ] payment.paid.
[ ] payment.failed.
[ ] inventory.reserved.
[ ] inventory.released.
[ ] inventory.deducted.
[ ] promotion.applied.
[ ] promotion.redeemed.
[ ] review.created.
[ ] seller.ledger_created.
[ ] return.requested.
[ ] refund.completed.
[ ] shipping.tracking_updated.
[ ] campaign.product_approved.
[ ] flash_sale.item_sold.
[ ] behavior.product_viewed.
[ ] behavior.add_to_cart.
[ ] ad.impression.
[ ] ad.clicked.
[ ] ad.conversion.
[ ] affiliate.conversion_created.
[ ] fraud.case_created.
[ ] risk.score_updated.
[ ] ai.recommendation_served.
[ ] ai.search_performed.
[ ] ai.fraud_score_generated.
```

## 6. Checklist test bắt buộc

```text
[ ] Test đăng ký/đăng nhập/phân quyền.
[ ] Test buyer không xem được dữ liệu buyer khác.
[ ] Test seller không xem được đơn shop khác.
[ ] Test admin phân quyền thấp không làm được quyền cao.
[ ] Test tạo sản phẩm và duyệt sản phẩm.
[ ] Test SKU và tồn kho.
[ ] Test hai người cùng mua SKU số lượng cuối.
[ ] Test giỏ hàng.
[ ] Test checkout tính tiền đúng.
[ ] Test voucher hết lượt.
[ ] Test voucher sai điều kiện.
[ ] Test tạo order.
[ ] Test order state machine.
[ ] Test hủy đơn hoàn tồn kho.
[ ] Test thanh toán thành công/thất bại.
[ ] Test ledger seller.
[ ] Test return/refund.
[ ] Test flash sale hết quota.
[ ] Test combo/freeship.
[ ] Test shipping tracking.
[ ] Test affiliate order bị hủy.
[ ] Test ads click trùng.
[ ] Test fraud rule.
[ ] Test AI không gợi ý sản phẩm hết hàng.
[ ] Test AI không tự đặt hàng khi chưa xác nhận.
```
