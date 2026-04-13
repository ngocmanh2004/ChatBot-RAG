# BÁO CÁO TIẾN ĐỘ TUẦN - CHATBOT RAG TECHSTORE
Ngày: 09/04/2026

## I. Mục tiêu tuần
- Hoàn thiện luồng hỏi đáp ngoài tư vấn sản phẩm.
- Bổ sung luồng FAQ/chính sách (đặc biệt là bảo mật thông tin).
- Giảm hành vi hardcode fallback sản phẩm.
- Mở đầy đủ các thành phần LLM/Retrieval để bot phân tích câu hỏi linh hoạt hơn.

## II. Những gì đã làm (chi tiết kỹ thuật)

### 1) Kích hoạt LLM phân loại và viết lại truy vấn
- Đã bật:
  - `LLM_CLASSIFICATION_DISABLED=false`
  - `LLM_REWRITE_DISABLED=false`
- Tác động:
  - Câu hỏi không còn đi theo rule cứng 100%.
  - Gemini phân tích `history + question` để chọn nhánh `vector_store | web_context | casual_convo`.
  - Query rewrite giúp truy xuất tài liệu tốt hơn.

### 2) Kích hoạt Self Query Retrieval của Pinecone
- Đã bật:
  - `SELF_QUERY_DISABLED=false`
- Tác động:
  - Retrieval không chỉ similarity thông thường, mà có thêm lớp phân tích metadata filter (theo `doc_type`, `policy_type`, ...).

### 3) Mở rộng web context (Tavily + Google CSE)
- Đã cấu hình:
  - `TAVILY_DISABLED=false`
  - `GOOGLE_SEARCH_DISABLED=false`
  - `GOOGLE_CSE_ID=421ab2d1484664929`
- Tác động:
  - Câu hỏi kiến thức chung (ví dụ: “Thương mại điện tử là gì”) có thể lấy nguồn web để trả lời.

### 4) Sửa luồng chat để không ép “gợi ý sản phẩm” sai ngữ cảnh
- File chính: `src/services/chat.service.ts`
- Bổ sung phân loại ý định nội bộ:
  - `QueryIntentKind = product | policy_faq | general`
  - Hàm `detectQueryIntentKind(...)`
- Bổ sung ưu tiên nguồn tài liệu:
  - `prioritizeDocumentsByIntent(...)` ưu tiên `policy/faq` khi truy vấn chính sách.
- Bổ sung điều kiện fallback:
  - `shouldEnforceProductFallback(...)` chỉ ép fallback sản phẩm nếu câu hỏi thuộc ý định product.
- Tác động:
  - Các câu hỏi policy/FAQ/general không còn bị trả về danh sách điện thoại do fallback cũ.

### 5) Bổ sung nội dung chính sách bảo mật
- File: `src/services/policy.service.ts`
- Đã thêm:
  - `policy_type: "privacy"`
  - Mẫu dữ liệu “Chính sách bảo mật thông tin”
  - Rule detect policy type cho từ khóa `bao mat/rieng tu/privacy`.
- File: `src/models/productAttribute.model.ts`
  - Mô tả metadata `policy_type` đã cập nhật thêm `privacy`.

### 6) Tăng độ ổn định khởi động backend
- File: `src/config/mongodb.config.ts`
- Đã sửa:
  - Validate env MongoDB bắt buộc.
  - Không nuốt lỗi kết nối DB.
  - Fail-fast + log rõ “MongoDB connection failed”.
- Tác động:
  - Tránh trường hợp server “chạy giả” nhưng API chat/session trả 500.

## III. Kết quả test nhanh
- Kiểm tra endpoint retrieval/debug:
  - `GET /api/v1/products/preview` trả về 200 và có dữ liệu.
- Kiểm tra luồng web context:
  - Câu hỏi “Thương mại điện tử là gì” được classify sang `web_context`.
  - Rewrite query + tổng hợp context từ web + Gemini trả về JSON hợp lệ.
- Đã tạo bộ smoke test API:
  - Script: `scripts/rag-smoke-test.ts`
  - Lệnh chạy: `bun run test:rag`
  - Nhóm test:
    - general knowledge
    - policy privacy
    - shipping FAQ
    - product recommendation

## IV. Hạn chế hiện tại
- Phụ thuộc trạng thái MongoDB service local (nếu service stop thì session/chat lỗi).
- Chưa có bộ benchmark định lượng lớn (chưa có dashboard metric hit@k/accuracy theo tập câu hỏi có nhãn).
- Chưa khóa auth/role cho route chat/products ở production mode.
- Quota Gemini free-tier dễ chạm trần (đã ghi nhận lỗi 429 trong smoke test).

## V. Kế hoạch tiếp theo
1. Chuẩn hóa bộ test 30-50 câu hỏi có expected output để báo cáo metric tuần.
2. Tối ưu đồng bộ Pinecone theo hướng idempotent để tránh trùng tài liệu khi sync.
3. Bật lại auth/authorization cho endpoint chat/products theo role.
4. Tách profile log dev/prod:
   - Dev: `RAG_DEBUG=true`, `LLM_VERBOSE=true`
   - Prod: `RAG_DEBUG=false`, `LLM_VERBOSE=false`
