# GIAI ĐOẠN 3: LOGISTICS, ADS, AFFILIATE, FRAUD, BI

# 25. PLAN RIÊNG GIAI ĐOẠN 3  
## Marketplace Scale – Logistics, Ads, Affiliate, Fraud, BI

---

## 25.1. Mục tiêu sản phẩm của giai đoạn 3

Giai đoạn 3 dành cho nền tảng đã có nhiều giao dịch, nhiều seller, nhiều campaign và cần vận hành quy mô lớn.

Mục tiêu:

```text
- Tăng khả năng vận hành logistics.
- Tạo doanh thu mới từ quảng cáo nội sàn.
- Mở rộng kênh bán bằng affiliate/KOL/KOC.
- Kiểm soát gian lận tốt hơn.
- Có trung tâm tranh chấp chuyên nghiệp.
- Có BI dashboard phục vụ lãnh đạo và vận hành.
- Bắt đầu tách một số module nặng thành service riêng.
```

---

## 25.2. Phạm vi giai đoạn 3

### 25.2.1. Trong phạm vi

| Nhóm | Tính năng |
|---|---|
| Warehouse | Đa kho, tồn kho theo kho, stock movement |
| Fulfillment | Sàn nhận hàng, lưu kho, đóng gói, xuất kho |
| Logistics | Chọn hãng vận chuyển tối ưu |
| Ads | Sponsored product, keyword bidding, impression/click |
| Affiliate | Partner/KOL/KOC, tracking link, hoa hồng |
| Referral | Mã giới thiệu người dùng |
| Dispute | Trung tâm tranh chấp nâng cao |
| Fraud | Rule-based fraud detection |
| Risk | Risk scoring buyer/seller/order |
| Policy | Policy engine cho ngành hàng/seller |
| BI | Data warehouse, dashboard GMV/AOV/CAC/LTV |
| Brand | Brand Mall, bảo vệ thương hiệu |

### 25.2.2. Ngoài phạm vi

| Chưa làm | Lý do |
|---|---|
| ML fraud nâng cao | Đưa sang giai đoạn 4 |
| AI shopping assistant | Đưa sang giai đoạn 4 |
| Dynamic pricing AI | Đưa sang giai đoạn 4 |
| Recommendation engine full | Đưa sang giai đoạn 4 |

---

## 25.3. Luồng nghiệp vụ cần code

### 25.3.1. Luồng seller gửi hàng vào kho sàn

```text
1. Seller tạo yêu cầu nhập kho.
2. Seller chọn SKU và số lượng.
3. Admin/warehouse xác nhận lịch nhận hàng.
4. Kho nhận hàng.
5. Nhân sự kho kiểm đếm.
6. Hệ thống tạo stock movement loại inbound.
7. Tồn kho warehouse_stock tăng.
8. SKU được đánh dấu có thể bán theo mô hình fulfillment by platform.
```

### 25.3.2. Luồng fulfillment by platform

```text
1. Buyer đặt hàng SKU đang nằm trong kho sàn.
2. Hệ thống chọn kho phù hợp.
3. Hệ thống tạo fulfillment_order.
4. Nhân sự kho pick hàng.
5. Nhân sự kho pack hàng.
6. Hệ thống tạo shipment.
7. Đơn vị vận chuyển lấy hàng.
8. Tracking cập nhật cho buyer.
9. Khi giao thành công, finance ghi nhận seller receivable.
```

### 25.3.3. Luồng quảng cáo nội sàn

```text
1. Seller tạo ads campaign.
2. Seller chọn sản phẩm quảng cáo.
3. Seller chọn từ khóa hoặc vị trí hiển thị.
4. Seller đặt ngân sách.
5. Hệ thống phân phối quảng cáo trên search/home/category.
6. Khi buyer thấy quảng cáo, ghi ad.impression.
7. Khi buyer click, ghi ad.clicked.
8. Nếu mua hàng, ghi ad.conversion.
9. Hệ thống tính chi phí quảng cáo.
10. Seller xem ROAS, CPC, spend.
```

### 25.3.4. Luồng affiliate

```text
1. Admin duyệt affiliate partner.
2. Partner tạo tracking link.
3. Người mua click link.
4. Hệ thống lưu click_id/cookie/source.
5. Buyer đặt hàng.
6. Nếu đơn hoàn tất, hệ thống ghi conversion.
7. Hệ thống tính hoa hồng.
8. Nếu đơn hủy/hoàn, hoa hồng bị hủy hoặc điều chỉnh.
```

### 25.3.5. Luồng fraud/risk rule-based

```text
1. Hệ thống nhận event order.created/payment.paid/refund.requested/review.created.
2. Fraud service kiểm tra rule:
   - Nhiều đơn từ cùng thiết bị.
   - Nhiều tài khoản cùng địa chỉ.
   - Tỷ lệ hủy đơn bất thường.
   - Tỷ lệ hoàn tiền bất thường.
   - Review bất thường.
   - Dùng voucher bất thường.
3. Hệ thống tạo risk_event.
4. Risk score buyer/seller/order được cập nhật.
5. Nếu vượt ngưỡng, tạo fraud_case.
6. Admin fraud team xử lý.
```

---

## 25.4. Module/service cần code ở giai đoạn 3

### 25.4.1. Warehouse Service

Cần code:

```text
- Warehouse CRUD.
- Warehouse stock.
- Stock movement.
- Inbound request.
- Outbound request.
- Transfer stock between warehouses.
```

Bảng cần thêm:

```text
warehouses
warehouse_stocks
warehouse_stock_movements
warehouse_inbound_requests
warehouse_outbound_requests
```

### 25.4.2. Fulfillment Service

Cần code:

```text
- Fulfillment order.
- Pick list.
- Packing job.
- Fulfillment status.
- Warehouse handover to carrier.
```

Bảng cần thêm:

```text
fulfillment_orders
fulfillment_order_items
picking_jobs
packing_jobs
```

### 25.4.3. Logistics Orchestration Service

Cần code:

```text
- Carrier scoring.
- Select carrier by cost/SLA/location.
- Retry create shipment if carrier failed.
- Compare shipping fee.
- Estimate delivery date.
```

Bảng cần thêm:

```text
carrier_service_levels
carrier_rate_cards
carrier_performance_logs
logistics_routing_rules
```

### 25.4.4. Ads Service

Cần code:

```text
- Ads campaign.
- Ads ad group.
- Sponsored product.
- Keyword bidding.
- Impression tracking.
- Click tracking.
- Spend calculation.
- Conversion attribution.
```

Bảng cần thêm:

```text
ads_campaigns
ads_ad_groups
ads_keywords
ads_bids
ads_impressions
ads_clicks
ads_conversions
ads_spend_logs
```

### 25.4.5. Affiliate Service

Cần code:

```text
- Affiliate partner.
- Tracking link.
- Click tracking.
- Conversion tracking.
- Commission calculation.
- Payout request.
```

Bảng cần thêm:

```text
affiliate_partners
affiliate_links
affiliate_clicks
affiliate_conversions
affiliate_commissions
affiliate_payouts
```

### 25.4.6. Referral Service

Cần code:

```text
- Referral code.
- Referral invitation.
- Referral reward.
- Anti-abuse rules.
```

Bảng cần thêm:

```text
referral_codes
referral_invites
referral_rewards
```

### 25.4.7. Dispute Center

Cần code:

```text
- Dispute case.
- Dispute evidence.
- Buyer/seller/admin message.
- Dispute decision.
- Escalation flow.
```

Bảng cần thêm:

```text
disputes
dispute_messages
dispute_evidences
dispute_decisions
```

### 25.4.8. Fraud & Risk Service

Cần code:

```text
- Fraud rule.
- Risk event.
- Risk score.
- Fraud case.
- Admin review.
```

Bảng cần thêm:

```text
fraud_rules
fraud_cases
risk_events
risk_scores
risk_score_histories
```

### 25.4.9. Policy Engine

Cần code:

```text
- Policy rule.
- Rule version.
- Rule target.
- Rule execution log.
```

Bảng cần thêm:

```text
policy_rules
policy_rule_versions
policy_targets
policy_execution_logs
```

### 25.4.10. BI/Data Warehouse

Cần code:

```text
- ETL job.
- Sales mart.
- Seller mart.
- Product mart.
- Campaign mart.
- Ads mart.
- Finance mart.
```

Bảng hoặc kho dữ liệu:

```text
fact_orders
fact_order_items
fact_payments
fact_promotions
fact_ads
fact_refunds
dim_users
dim_sellers
dim_products
dim_categories
dim_time
```

---

## 25.5. API cần code ở giai đoạn 3

### Warehouse/Fulfillment API

```text
POST   /api/v1/admin/warehouses
GET    /api/v1/admin/warehouses
POST   /api/v1/seller/warehouse-inbound-requests
GET    /api/v1/admin/warehouse-inbound-requests
PATCH  /api/v1/admin/warehouse-inbound-requests/:id/receive

GET    /api/v1/admin/fulfillment-orders
PATCH  /api/v1/admin/fulfillment-orders/:id/pick
PATCH  /api/v1/admin/fulfillment-orders/:id/pack
PATCH  /api/v1/admin/fulfillment-orders/:id/handover
```

### Ads API

```text
POST   /api/v1/seller/ads/campaigns
GET    /api/v1/seller/ads/campaigns
PATCH  /api/v1/seller/ads/campaigns/:id
POST   /api/v1/seller/ads/campaigns/:id/ad-groups
POST   /api/v1/seller/ads/ad-groups/:id/keywords
POST   /api/v1/ads/impression
POST   /api/v1/ads/click
GET    /api/v1/seller/ads/reports
```

### Affiliate/Referral API

```text
POST   /api/v1/admin/affiliate-partners
PATCH  /api/v1/admin/affiliate-partners/:id/approve
POST   /api/v1/affiliate/links
GET    /api/v1/affiliate/reports
POST   /api/v1/affiliate/click
GET    /api/v1/admin/affiliate/commissions

POST   /api/v1/referral/invite
GET    /api/v1/referral/rewards
```

### Dispute/Fraud API

```text
POST   /api/v1/orders/:id/disputes
GET    /api/v1/disputes/:id
POST   /api/v1/disputes/:id/messages
POST   /api/v1/disputes/:id/evidences
PATCH  /api/v1/admin/disputes/:id/resolve

GET    /api/v1/admin/fraud-cases
GET    /api/v1/admin/risk-scores
PATCH  /api/v1/admin/fraud-cases/:id/status
```

---

## 25.6. UI page cần làm ở giai đoạn 3

### Seller Center

```text
/seller/warehouse
/seller/warehouse/inbound
/seller/ads
/seller/ads/campaigns/new
/seller/ads/reports
/seller/affiliate
/seller/disputes
/seller/customer-insights
```

### Admin Console

```text
/admin/warehouses
/admin/fulfillment
/admin/logistics-routing
/admin/ads
/admin/affiliate
/admin/referral
/admin/disputes
/admin/fraud-cases
/admin/risk-scores
/admin/policy-engine
/admin/bi-dashboard
/admin/brand-protection
```

### Buyer Web

```text
/brand-mall
/disputes/:id
/referral
/group-buying
```

---

## 25.7. Event cần phát sinh ở giai đoạn 3

```text
warehouse.inbound_requested
warehouse.stock_received
warehouse.stock_moved
fulfillment.order_created
fulfillment.picked
fulfillment.packed
fulfillment.handed_over
logistics.carrier_selected
ad.impression
ad.clicked
ad.conversion
ads.budget_spent
affiliate.link_created
affiliate.clicked
affiliate.conversion_created
affiliate.commission_approved
referral.invited
referral.reward_granted
dispute.opened
dispute.evidence_uploaded
dispute.resolved
risk.score_updated
fraud.case_created
policy.rule_executed
bi.snapshot_created
brand.violation_reported
```

---

## 25.8. Tiêu chí nghiệm thu giai đoạn 3

```text
[ ] Hệ thống quản lý được nhiều kho.
[ ] Tồn kho theo kho không sai lệch với tồn kho tổng.
[ ] Seller tạo inbound request được.
[ ] Kho nhận hàng và tăng tồn đúng.
[ ] Fulfillment order xử lý được pick/pack/handover.
[ ] Logistics chọn được carrier theo rule.
[ ] Seller tạo ads campaign được.
[ ] Impression/click/conversion được ghi đúng.
[ ] Không tính phí click trùng bất thường.
[ ] Affiliate link tracking được.
[ ] Đơn hoàn tất mới phát sinh hoa hồng.
[ ] Đơn hủy/hoàn không trả hoa hồng sai.
[ ] Buyer/seller/admin xử lý dispute được.
[ ] Fraud rule tạo được fraud case.
[ ] Risk score cập nhật theo event.
[ ] Policy engine áp rule đúng.
[ ] BI dashboard khớp với dữ liệu giao dịch gốc.
```

---

## 25.9. Lưu ý kỹ thuật chống xung đột cho giai đoạn 4

| Vấn đề | Cách làm ở giai đoạn 3 |
|---|---|
| Sau này cần ML fraud | Risk/fraud event phải chuẩn hóa |
| Sau này cần AI ads optimization | Ads impression/click/conversion phải đầy đủ |
| Sau này cần demand forecasting | Warehouse/order/campaign data phải theo thời gian |
| Sau này cần recommendation | Product impression/click/purchase event phải có user_id |
| Sau này cần customer 360 | Event phải liên kết user/device/session |
| Sau này cần seller 360 | Seller metrics phải lưu theo ngày |
| Sau này cần model training | Data warehouse phải có fact/dim rõ |
| Sau này cần realtime AI | Event bus phải đủ ổn định |

---
