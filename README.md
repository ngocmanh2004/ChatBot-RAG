# KhoaLuan2026 - Hệ thống TechStore & Chatbot FlexBot RAG

---

## 1) Tổng quan đề tài
Dự án bao gồm 3 phần chính:
- `TechStore_BE` (ASP.NET Core + SQL Server): Backend của website bán hàng.
- `TechStore_FE` (Angular): Giao diện website và widget chatbot dành cho người dùng.
- `M-Bot` (Bun + Express + LangChain + Gemini + Pinecone + MongoDB): Backend điều phối chatbot RAG.

**Mục tiêu hiện tại:**
- Lưu trữ đầy đủ thông số kỹ thuật chi tiết sản phẩm (CPU/GPU/RAM/Camera/Pin/Tần số quét...).
- Chatbot RAG trả lời dựa trên dữ liệu thực tế truy xuất trực tiếp từ Database.
- Tư vấn đề xuất từ 1-3 sản phẩm theo đúng nhu cầu (ưu tiên camera hoặc hiệu năng) và tối ưu hóa theo ngân sách khách hàng.

---

## 2) Kiến trúc hệ thống

### 2.1 Luồng xử lý tổng thể
1. Người dùng gửi tin nhắn trên giao diện Frontend (FE).
2. FE gọi API tới `M-Bot` thông qua endpoint `/api/v1/sessions/...`.
3. `M-Bot` thực hiện phân loại truy vấn (Query Classification) -> Truy hồi vector (Pinecone) + Lấy dữ liệu sản phẩm thời gian thực từ `TechStore_BE`.
4. Nếu là truy vấn mua hàng có tiêu chí (camera/hiệu năng/ngân sách), chatbot ưu tiên xếp hạng (ranking) theo thông số kỹ thuật (specs) từ DB.
5. Trả về định dạng JSON chuẩn để FE hiển thị trực quan cho người dùng.

### 2.2 Các hệ thống lưu trữ (Database/Storage)
- **SQL Server (`TechStore`)**: Nguồn dữ liệu gốc (Source of Truth) về sản phẩm và thông số kỹ thuật.
- **Pinecone**: Cơ sở dữ liệu Vector lưu trữ tài liệu về sản phẩm, FAQ và chính sách bảo hành.
- **MongoDB**: Lưu trữ phiên làm việc (session), lịch sử chat, bản ghi hội thoại và nhật ký tương tác API (interaction log).

---

## 3) Cấu trúc thư mục quan trọng

```text
D:\KhoaLuan2026
├─ TechStore
│  ├─ TechStore_BE (Dự án .NET Core)
│  ├─ TechStore_FE (Dự án Angular)
│  └─ schema.sql (File cấu trúc Database)
└─ M-Bot
   ├─ server.ts (File chạy server chính)
   ├─ .env (Biến môi trường)
   └─ src
      ├─ routes/ (Định nghĩa các luồng API)
      ├─ controller/ (Xử lý logic điều hướng)
      ├─ services/ (Logic nghiệp vụ cốt lõi)
      ├─ config/ (Cấu hình kết nối DB/Cloud)
      └─ utils/ (Công cụ hỗ trợ & Prompts)
```

## 4) Luồng xử lý Chatbot RAG (Chi tiết tệp tin/hàm)

### 4.1 Frontend gọi API Chatbot
- **Cấu hình Endpoint trong FE service:**
  `TechStore/TechStore_FE/src/app/Service/chatbot.service.ts:18`
- **Khởi tạo phiên làm việc (Session):**
  `createSession(...)` -> POST `/sessions`:
  `TechStore/TechStore_FE/src/app/Service/chatbot.service.ts:23`
- **Gửi tin nhắn và nhận phản hồi:**
  `sendMessage(...)` -> POST `/sessions/{sessionId}`:
  `TechStore/TechStore_FE/src/app/Service/chatbot.service.ts:29`
- **Xử lý tách dữ liệu JSON từ phản hồi:**
  `extractAssistantText(...)`, `extractJsonPayload(...)`:
  `TechStore/TechStore_FE/src/app/Service/chatbot.service.ts:43`, `:83`

### 4.2 M-Bot Route và Controller
- **Đăng ký Route cho Session:**
  `M-Bot/src/routes/chat.route.ts:74`
- **Endpoint nhận tin nhắn POST:**
  `M-Bot/src/routes/chat.route.ts:47`
- **Controller tiếp nhận và điều phối:**
  `streamMessageController(...)`:
  `M-Bot/src/controller/chat.controller.ts:52`
- **Điểm vào chính của quy trình RAG:**
  `processUserQuery(message, sessionId)`:
  `M-Bot/src/controller/chat.controller.ts:56`

### 4.3 Điều phối RAG cốt lõi (Core Orchestration)
- **Hàm xử lý trung tâm:**
  `processUserQuery(...)`:
  `M-Bot/src/services/chat.service.ts:758`

**Quy trình chính bên trong `processUserQuery`:**
1. `classifyUserQuery(...)`: Phân loại loại truy vấn người dùng.
2. `rewriteQuery`: Viết lại truy vấn (nếu được bật) để tối ưu tìm kiếm vector.
3. `safeQueryCombinedResult(...)`: Truy xuất tài liệu từ Vector Store.
4. `extractProductCandidates(...)`: Trích xuất các sản phẩm tiềm năng từ tài liệu.
5. `buildProductCandidatesFromBackend(...)`: Lấy dữ liệu từ Backend API và xếp hạng theo thông số kỹ thuật.
6. `generateAnswer(...)`: Tổng hợp thông tin và tạo câu trả lời cuối cùng.

### 4.4 Logic Xếp hạng theo thông số kỹ thuật (Specs-based Ranking)
Hệ thống ưu tiên dữ liệu cứng từ Database thay vì chỉ dựa vào mô tả văn bản:
- **Phân tích ngân sách từ câu hỏi:**
  `detectBudgetFromQuestion(...)` (Xử lý các định dạng: 20 triệu, 20tr, 20000k...).
- **Nhận diện ý định (Intent) về camera hoặc hiệu năng:**
  `detectProductIntent(...)`.
- **Tính toán điểm số dựa trên thông số:**
  `rankProductByIntent(...)`: Đánh giá dựa trên RAM/Bộ nhớ/Tần số quét/Pin/Sạc nhanh/Camera/Cấp bậc CPU-GPU.
- **Lọc sản phẩm theo khoảng giá:**
  `pickCandidatesByBudget(...)`: Ưu tiên dải ngân sách 75%-100% -> 50%-75% -> thấp hơn.
- **Giới hạn đề xuất:** Trả về tối đa 3 sản phẩm tốt nhất.

### 4.5 Cơ chế tránh nhiễu từ mô tả Vector (Bypass LLM)
Khắc phục vấn đề LLM bị ảnh hưởng bởi các đoạn mô tả cũ trong context:
- `shouldBypassLLMForProductIntent(...)`: Kiểm tra điều kiện bỏ qua LLM.
- `buildCandidateOnlyResponse(...)`: Trả về JSON trực tiếp từ kết quả Ranking của Backend, không cho LLM viết lại nội dung đề xuất sản phẩm.

### 4.6 Cơ chế dự phòng JSON (Fallback)
- `enforceProductFallback(...)`: Đảm bảo đầu ra luôn là JSON hợp lệ và không trả lời "không có dữ liệu" khi thực tế đã tìm thấy sản phẩm tiềm năng.

---

## 5) Vector Store và Truy hồi (Retrieval)
- **Tệp xử lý chính:** `M-Bot/src/services/vectorStore.service.ts`
- **Đồng bộ dữ liệu:** `syncAllDocumentsToVectorStore(...)` (Sản phẩm + FAQ + Chính sách).
- **Tìm kiếm tương đồng:** `searchSimilarDocuments(...)`.
- **Tìm kiếm Self-query:** `searchDocumentsWithSelfQuery(...)` (có thể bật/tắt qua ENV).
- **Hợp nhất kết quả:** `queryCombinedResult(...)`.

---

## 6) Luồng dữ liệu sản phẩm (TechStore_BE -> M-Bot)

### 6.1 API từ TechStore_BE
- **API danh sách sản phẩm:** `/api/products` (`ProductsController.cs:34`).
- **API chi tiết sản phẩm:** `/api/products/{id}` (`ProductsController.cs:74`).
- **Các trường dữ liệu đã cung cấp:** `cpu_chip`, `gpu`, `ram_gb`, `storage_gb`, `battery_mah`, `fast_charge_w`, `rear_camera_mp`, `front_camera_mp`, `screen_size_inch`, `screen_resolution`, `refresh_rate_hz`.

### 6.2 Đồng bộ hóa dữ liệu
- Model sản phẩm phía .NET đồng nhất với Database.
- Hệ thống Index hiệu năng trong SQL Server: `IX_Products_PerformanceFilters`.
- FlexBot thực hiện chuẩn hóa dữ liệu thông qua hàm `toSpecificationsFromRaw` trước khi đưa vào logic RAG.

---

## 7) Quản lý phiên và Nhật ký truy vết
- **Tệp xử lý:** `M-Bot/src/services/conversations.service.ts`
- **Quản lý phiên chat:** `createChatSession`, `getChatHistory`, `addMessageToHistory`.
- **Lưu trữ lâu dài:** `saveConversation` (Lưu hội thoại) và `saveApiInteraction` (Lưu log gọi API ngoại vi).
- **Cấu hình MongoDB Atlas:** `M-Bot/src/config/mongodb.config.ts:18`.

---

## 8) Các Endpoint Demo

### 8.1 M-Bot
- `POST /api/v1/sessions`: Khởi tạo phiên.
- `POST /api/v1/sessions/{sessionId}`: Chat RAG.
- `GET /api/v1/products/preview`: Xem dữ liệu thông số từ Backend .NET.
- `GET /api/v1/products/vector-preview?q=...`: Kiểm tra kết quả truy hồi Vector.
- `POST /api/v1/products/sync`: Kích hoạt đồng bộ lại Vector Store.

### 8.2 TechStore_BE
- `GET /api/products`: Kiểm tra danh sách sản phẩm gốc.
- `GET /api/products/{id}`: Kiểm tra chi tiết một sản phẩm.

---

## 9) Biến môi trường quan trọng (.env)
- `MAIN_BACKEND_API`: Trỏ tới URL của Backend .NET.
- `RAG_DEBUG=true`: Bật nhật ký suy luận của hệ thống RAG.
- `LLM_CLASSIFICATION_DISABLED=true`: Sử dụng phân loại theo luật (Rule-based) thay vì LLM.
- `SELF_QUERY_DISABLED=true`: Ưu tiên tìm kiếm tương đồng (Similarity Search) đơn giản.

---

## 10) Tình trạng dự án hiện tại

**Kết quả đạt được:**
- Chatbot đề xuất sản phẩm dựa trên thông số kỹ thuật thực tế (Specs), không bị nhầm lẫn bởi mô tả văn bản.
- Thuật toán ưu tiên sản phẩm sát với ngân sách người dùng nhất.
- Đảm bảo tính ổn định của dữ liệu thông qua hệ thống log RAG chi tiết.

**Đề xuất nâng cấp (Dành cho buổi báo cáo):**
- Chuẩn hóa Encoding UTF-8 cho toàn bộ hệ thống Prompt.
- Tách riêng phản hồi sản phẩm cấu trúc (Structured response) để FE hiển thị Card đẹp hơn.
- Tích hợp thêm các chỉ số Benchmark (AnTuTu/Geekbench) để xếp hạng hiệu năng chính xác tuyệt đối.

---

## 11) Kịch bản Demo nhanh
1. Chạy **TechStore_BE** tại Port 5000.
2. Chạy **M-Bot** tại Port 3000.
3. Tạo Session người dùng qua `POST /api/v1/sessions`.
4. Gửi câu hỏi thử nghiệm: *"Tôi muốn mua điện thoại có camera đẹp để chụp hình, ngân sách tầm 20 triệu"*.
5. Kiểm tra JSON phản hồi: Đảm bảo có danh sách `products` kèm các thông số kỹ thuật thực tế và câu trả lời phân tích dựa trên ngân sách đã cung cấp.

---
**Người thực hiện: Nguyễn Ngọc Mạnh**
## 12) Luong vi du message cu the (gaming 20 trieu)

Message mau:
```json
{ "message": "toi muon mua dien thoai hieu nang manh de choi game, toi co 20 trieu" }
```

Luong chay thuc te:
1. FE (`TechStore_FE`) goi `ChatbotService.sendMessage(...)` -> `POST /api/v1/sessions/{sessionId}`.
2. M-Bot route nhan request: `M-Bot/src/routes/chat.route.ts`.
3. Controller dieu phoi: `M-Bot/src/controller/chat.controller.ts::streamMessageController(...)` -> `processUserQuery(...)`.
4. RAG core (`M-Bot/src/services/chat.service.ts`) xu ly:
- `classifyUserQuery(...)` -> `vector_store`
- `rewriteQuery(...)` (co the skip neu tat rewrite)
- `safeQueryCombinedResult(...)` -> truy hoi vector (Pinecone)
- `buildProductCandidatesFromBackend(...)` -> lay products + specs tu TechStore_BE
- `rankProductByIntent(...)` + `pickCandidatesByBudget(...)` -> xep hang theo hieu nang + budget 20tr (uu tien 15-20tr)
5. Goi Pinecone qua `M-Bot/src/services/vectorStore.service.ts::queryCombinedResult(...)`.
6. Goi TechStore_BE qua `M-Bot/src/services/product.service.ts::fetchAllProducts(...)` -> `GET http://localhost:5000/api/products`.
7. Neu truy van mua hang co tieu chi (camera/hieu nang/ngan sach), he thong uu tien response tu backend ranking:
- `shouldBypassLLMForProductIntent(...)`
- `buildCandidateOnlyResponse(...)`
8. Controller tra ve `result.responseText` (JSON string).
9. FE parse JSON (`extractAssistantText`) va hien thi de xuat san pham.

Tom tat 1 dong de demo voi thay:
- `TechStore_FE -> M-Bot(chat.service) -> Pinecone + TechStore_BE(SQL specs) -> M-Bot -> TechStore_FE`.#   C h a t B o t - R A G  
 