# GIAI ĐOẠN 4: AI, BIG DATA, CÁ NHÂN HÓA, TỰ ĐỘNG HÓA

# 26. PLAN RIÊNG GIAI ĐOẠN 4  
## AI & Big Data – Cá nhân hóa, tự động hóa, dự báo, chống gian lận nâng cao

---

## 26.1. Mục tiêu sản phẩm của giai đoạn 4

Giai đoạn 4 không phải chỉ “gắn chatbot AI” vào website.  
Đây là giai đoạn chuyển nền tảng thành hệ thống vận hành bằng dữ liệu.

Mục tiêu:

```text
- Cá nhân hóa trải nghiệm người mua.
- Gợi ý sản phẩm chính xác hơn.
- Tìm kiếm theo ngữ nghĩa, không chỉ theo từ khóa.
- Hỗ trợ seller tự động viết nội dung, tối ưu giá, tối ưu tồn kho.
- Hỗ trợ admin phát hiện gian lận nhanh hơn.
- Dự báo nhu cầu, doanh thu, logistics.
- Tự động hóa marketing theo hành vi.
```

---

## 26.2. Điều kiện bắt buộc trước khi bắt đầu giai đoạn 4

Không nên triển khai AI nếu chưa có các nền tảng sau:

```text
[ ] Product catalog đủ sạch.
[ ] SKU/variant rõ ràng.
[ ] Order data đủ lịch sử.
[ ] Event tracking ổn định.
[ ] Search log được ghi đầy đủ.
[ ] Review data đủ số lượng.
[ ] Return/refund/cancel data rõ.
[ ] Ads/campaign data rõ nếu muốn tối ưu marketing.
[ ] Data warehouse có fact/dim.
[ ] Có chính sách bảo mật dữ liệu.
[ ] Có cơ chế xin consent người dùng nếu dùng dữ liệu cá nhân.
```

Nếu thiếu các dữ liệu trên, AI sẽ cho kết quả kém, sai hoặc không có giá trị kinh doanh.

---

## 26.3. Phạm vi giai đoạn 4

### 26.3.1. Trong phạm vi

| Nhóm | Tính năng |
|---|---|
| Recommendation | Gợi ý sản phẩm trang chủ, chi tiết sản phẩm, giỏ hàng |
| AI Search | Tìm kiếm ngữ nghĩa, hiểu nhu cầu |
| AI Shopping Assistant | Chat tư vấn mua hàng |
| Review Summary | Tóm tắt đánh giá sản phẩm |
| Seller AI | Viết mô tả sản phẩm, gợi ý SEO, gợi ý giá |
| Forecasting | Dự báo nhu cầu, tồn kho, logistics |
| Fraud ML | Phát hiện gian lận bằng mô hình học máy |
| Customer Segmentation | Phân nhóm khách hàng |
| Marketing Automation | Gửi voucher/push/email theo hành vi |
| Ads Optimization | Gợi ý từ khóa, ngân sách, bid |
| Data Platform | Data lake, feature store, model serving, model monitoring |

### 26.3.2. Ngoài phạm vi hoặc cần kiểm soát chặt

| Tính năng | Lưu ý |
|---|---|
| AI tự động duyệt hoàn tiền | Chỉ nên đề xuất, không tự quyết toàn bộ |
| AI tự động khóa seller | Chỉ cảnh báo hoặc chuyển admin duyệt |
| AI tự động tăng/giảm giá bán | Cần seller xác nhận |
| AI dùng dữ liệu nhạy cảm | Cần tuân thủ chính sách riêng tư |
| AI sinh nội dung quảng cáo | Cần kiểm duyệt trước khi public |

---

## 26.4. Kiến trúc dữ liệu cần code

### 26.4.1. Data pipeline

Cần xây pipeline:

```text
Application Database
Application Events
Behavior Events
Search Logs
Ads Logs
Shipping Logs
Payment Logs
Return/Refund Logs
        |
        v
Event Bus / Queue
        |
        v
Data Lake
        |
        v
Data Warehouse
        |
        v
Feature Store
        |
        v
Model Training
        |
        v
Model Registry
        |
        v
Model Serving API
        |
        v
Buyer Web / Seller Center / Admin Console
```

### 26.4.2. Feature Store

Feature store cần lưu đặc trưng cho:

```text
User features:
- Số lần xem sản phẩm.
- Danh mục quan tâm.
- Tần suất mua.
- Giá trị đơn trung bình.
- Sản phẩm thường mua.
- Thời gian hoạt động.
- Tỷ lệ hủy/hoàn.

Product features:
- Lượt xem.
- Lượt add to cart.
- Lượt mua.
- Tỷ lệ chuyển đổi.
- Điểm đánh giá.
- Giá hiện tại.
- Mức giảm giá.
- Ngành hàng.
- Seller quality score.

Seller features:
- Tỷ lệ hủy.
- Tỷ lệ giao trễ.
- Tỷ lệ hoàn.
- Điểm đánh giá.
- Doanh thu.
- Tốc độ xử lý đơn.
- Số cảnh báo vi phạm.

Order/risk features:
- Giá trị đơn.
- Phương thức thanh toán.
- Địa chỉ giao hàng.
- Thiết bị/IP/session.
- Lịch sử voucher.
- Lịch sử hoàn tiền.
```

Bảng hoặc storage đề xuất:

```text
feature_user_daily
feature_product_daily
feature_seller_daily
feature_order_risk
feature_search_keyword_daily
feature_campaign_daily
```

---

## 26.5. Module AI cần code

### 26.5.1. Recommendation Service

Cần code:

```text
- Homepage recommendation.
- Product detail recommendation.
- Similar products.
- Frequently bought together.
- Cart recommendation.
- Personalized ranking.
```

API:

```text
GET /api/v1/ai/recommendations/homepage
GET /api/v1/ai/recommendations/product/:productId
GET /api/v1/ai/recommendations/cart
```

Dữ liệu cần:

```text
behavior_events
orders
order_items
product_views
cart_items
reviews
product_attributes
```

### 26.5.2. AI Search Service

Cần code:

```text
- Semantic search.
- Query understanding.
- Synonym expansion.
- Intent detection.
- Search result reranking.
```

API:

```text
POST /api/v1/ai/search
GET  /api/v1/ai/search/suggestions
```

Dữ liệu cần:

```text
search_logs
search_clicks
product_titles
product_descriptions
product_attributes
category_data
```

### 26.5.3. AI Shopping Assistant

Cần code:

```text
- Chat tư vấn mua hàng.
- Gợi ý sản phẩm theo nhu cầu.
- Hỏi thêm điều kiện nếu thiếu thông tin.
- So sánh sản phẩm.
- Gợi ý deal tốt nhất.
- Dẫn về trang sản phẩm/giỏ hàng.
```

API:

```text
POST /api/v1/ai/shopping-assistant/chat
POST /api/v1/ai/shopping-assistant/compare
POST /api/v1/ai/shopping-assistant/suggest-combo
```

Lưu ý:

```text
AI không được tự đặt hàng nếu user chưa xác nhận.
AI không được tự áp voucher nếu chưa kiểm tra điều kiện thật.
AI phải lấy dữ liệu sản phẩm realtime từ catalog/search API.
```

### 26.5.4. Review Summary Service

Cần code:

```text
- Tóm tắt ưu điểm.
- Tóm tắt nhược điểm.
- Tóm tắt theo từng tiêu chí.
- Phát hiện review bất thường.
```

API:

```text
GET  /api/v1/products/:id/review-summary
POST /api/v1/admin/reviews/:id/analyze
```

Dữ liệu cần:

```text
reviews
review_images
review_votes
orders
```

### 26.5.5. Seller AI Assistant

Cần code:

```text
- Viết tiêu đề sản phẩm.
- Viết mô tả sản phẩm.
- Gợi ý bullet point.
- Gợi ý SEO keyword.
- Chấm điểm listing.
- Gợi ý ảnh cần bổ sung.
```

API:

```text
POST /api/v1/seller/ai/generate-title
POST /api/v1/seller/ai/generate-description
POST /api/v1/seller/ai/suggest-keywords
POST /api/v1/seller/ai/score-listing
```

Lưu ý:

```text
Nội dung AI tạo phải ở trạng thái draft.
Seller phải kiểm tra và xác nhận trước khi public.
```

### 26.5.6. Price Suggestion Service

Cần code:

```text
- So sánh giá cùng ngành hàng.
- Phân tích giá đối thủ trong sàn.
- Gợi ý khoảng giá.
- Gợi ý mức giảm khuyến mãi.
```

API:

```text
POST /api/v1/seller/ai/suggest-price
POST /api/v1/seller/ai/suggest-discount
```

Dữ liệu cần:

```text
sku_prices
orders
campaigns
competitor_products_internal
product_performance_daily
```

### 26.5.7. Demand & Inventory Forecasting

Cần code:

```text
- Dự báo nhu cầu SKU.
- Dự báo hết hàng.
- Gợi ý nhập thêm hàng.
- Dự báo nhu cầu theo campaign.
- Dự báo logistics theo khu vực.
```

API:

```text
GET /api/v1/seller/ai/inventory-forecast
GET /api/v1/admin/ai/demand-forecast
GET /api/v1/admin/ai/logistics-forecast
```

Dữ liệu cần:

```text
orders
order_items
inventory_stocks
warehouse_stock_movements
campaigns
seasonality
shipping_logs
```

### 26.5.8. Fraud ML Service

Cần code:

```text
- Fraud scoring bằng ML.
- Buyer abuse detection.
- Seller fraud detection.
- Review fraud detection.
- Voucher abuse detection.
```

API:

```text
POST /api/v1/internal/ai/fraud-score/order
POST /api/v1/internal/ai/fraud-score/user
GET  /api/v1/admin/ai/fraud-alerts
```

Dữ liệu cần:

```text
risk_events
fraud_cases
orders
payments
refunds
reviews
devices
sessions
voucher_redemptions
```

### 26.5.9. Marketing Automation

Cần code:

```text
- Segment khách hàng.
- Gửi voucher theo hành vi.
- Nhắc giỏ hàng bỏ quên.
- Gửi campaign theo sở thích.
- Churn prevention.
```

API:

```text
POST /api/v1/admin/marketing/segments
POST /api/v1/admin/marketing/automation-flows
GET  /api/v1/admin/marketing/automation-reports
```

Bảng cần thêm:

```text
customer_segments
marketing_automation_flows
marketing_automation_steps
marketing_messages
marketing_message_logs
```

---

## 26.6. UI page cần làm ở giai đoạn 4

### Buyer Web

```text
/ai-shopping-assistant
/search/ai
/account/recommendations
```

### Seller Center

```text
/seller/ai/listing-assistant
/seller/ai/price-suggestion
/seller/ai/inventory-forecast
/seller/ai/ad-optimization
```

### Admin Console

```text
/admin/ai/fraud-alerts
/admin/ai/demand-forecast
/admin/ai/model-monitoring
/admin/marketing/segments
/admin/marketing/automation
/admin/data-quality
```

---

## 26.7. Event cần phát sinh ở giai đoạn 4

```text
ai.recommendation_served
ai.recommendation_clicked
ai.search_performed
ai.search_result_clicked
ai.shopping_assistant_message_sent
ai.shopping_assistant_product_suggested
ai.review_summary_generated
ai.seller_title_generated
ai.seller_description_generated
ai.price_suggestion_generated
ai.inventory_forecast_generated
ai.fraud_score_generated
ai.marketing_segment_created
ai.automation_message_sent
model.prediction_served
model.feedback_received
model.drift_detected
```

---

## 26.8. Tiêu chí nghiệm thu giai đoạn 4

```text
[ ] Recommendation trả về sản phẩm hợp lệ, còn bán, còn tồn kho.
[ ] AI search trả kết quả đúng theo nhu cầu người dùng.
[ ] AI shopping assistant không bịa sản phẩm không tồn tại.
[ ] AI shopping assistant không tự đặt hàng khi chưa có xác nhận.
[ ] Review summary phản ánh đúng nội dung review.
[ ] Seller AI tạo nội dung ở trạng thái draft.
[ ] Price suggestion có giải thích lý do.
[ ] Inventory forecast có độ chính xác được đo định kỳ.
[ ] Fraud ML tạo risk score và có giải thích cơ bản.
[ ] Marketing automation không gửi trùng/quá nhiều tin.
[ ] Người dùng có thể opt-out khỏi cá nhân hóa nếu chính sách yêu cầu.
[ ] Có model monitoring.
[ ] Có log toàn bộ AI request/response quan trọng.
```

---

## 26.9. Lưu ý an toàn và kiểm soát AI

| Vấn đề | Quy tắc |
|---|---|
| AI bịa sản phẩm | AI chỉ được gợi ý sản phẩm từ catalog/search API |
| AI sai giá | Giá phải lấy realtime từ Pricing API |
| AI áp voucher sai | Voucher phải kiểm tra qua Promotion API |
| AI quyết định hoàn tiền sai | AI chỉ đề xuất, admin/seller xác nhận |
| AI khóa tài khoản sai | AI chỉ cảnh báo, admin quyết định |
| AI dùng dữ liệu cá nhân | Cần tuân thủ privacy/consent |
| AI tạo mô tả sai sự thật | Seller phải duyệt trước khi public |
| AI thiên vị seller | Cần monitoring ranking/recommendation |
| AI spam marketing | Cần frequency cap và opt-out |

---
