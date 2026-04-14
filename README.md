# M-BOT: TÀI LIỆU HƯỚNG DẪN HỆ THỐNG CHI TIẾT (BẢN KHÓA LUẬN)
*(Tài liệu chuyên sâu phân tích Kiến trúc RAG và Luồng Routing Dữ liệu của Chatbot)*

---

## 📚 MỤC LỤC
1. [Khái quát Kiến trúc Hệ thống](#1-khái-quát-kiến-trúc-hệ-thống)
2. [Cấu hình: Kiến trúc 4 Level AI Tối ưu Hóa](#2-cấu-hình-kiến-trúc-4-level-ai-tối-ưu-hóa)
3. [Luồng Thực thi Chi tiết Nhất (Hạt nhân của Bot)](#3-luồng-thực-thi-chi-tiết-nhất-hạt-nhân-của-bot)
   - [A. Router Pattern: Phân loại Ý định (Classification)](#a-router-pattern-phân-loại-ý-định-classification)
   - [B. Strategy Pattern: Xử lý theo từng luồng](#b-strategy-pattern-xử-lý-theo-từng-luồng)
   - [C. Kỹ thuật Ranking và Trích xuất Dữ liệu Mềm](#c-kỹ-thuật-ranking-và-trích-xuất-dữ-liệu-mềm)
4. [Phân tích Giải phẫu Code (Từng hàm, Từng file)](#4-phân-tích-giải-phẫu-code-từng-hàm-từng-file)
   - [`src/services/chat.service.ts`](#srcserviceschatservicets)
   - [`src/utils/ranking.util.ts`](#srcutilsrankingutilts)
   - [`src/utils/intentRegex.util.ts`](#srcutilsintentregexutilts)
5. [Ví dụ Case Study Thực Tế (Walkthrough)](#5-ví-dụ-case-study-thực-tế-walkthrough)

---

## 1. KHÁI QUÁT KIẾN TRÚC HỆ THỐNG

### 1.1 M-Bot là gì?
M-Bot là một Trợ lý ảo sử dụng công nghệ căn bản của **RAG** (Retrieval-Augmented Generation - Thế hệ tăng cường truy xuất) để tư vấn sản phẩm e-commerce. Nó lấy bộ não mềm mại của **LLM (Google Gemini)** kết hợp với cơ sở dữ liệu cứng nhắc chuẩn xác của doanh nghiệp (MongoDB / **Pinecone Vector DB**) để tạo ra câu trả lời vừa mượt mà vừa không bị bịa ra thông tin giả mạo (rất thường thấy ở các AI bị lỗi ảo giác - Hallucinations).

### 1.2 Tech stack
M-Bot sử dụng những công nghệ sau, đảm bảo tiêu chuẩn thiết kế Microservices mỏng, hiệu suất cao:
*   **Bun**: Runtime siêu tốc độ, quản lý module chạy thay thế NodeJS thông thường ở tầng máy chủ.
*   **Express**: Nền tảng API xử lý yêu cầu RESTful HTTP để Frontend App gọi vào.
*   **Pinecone**: Vector Database (Mảng Cơ sở Dữ liệu Vector) chính để làm việc với RAG, nó tính toán khoảng cách "từ ngữ" để lôi ra những tài liệu được miêu tả gần giống nhất với mong muốn của người dùng.
*   **Gemini 2.5 Flash**: LLM Model, đảm nhận 3 vai trò: (1) Thay thế não người để Chia luồng/Bắt bệnh cấu trúc câu hỏi phức tạp, (2) Nhờ RAG tạo bộ lọc Pinecone ngầm, (3) Lên văn bản trả lời mượt mà ở bước cuối cùng.

----

## 2. CẤU HÌNH: KIẾN TRÚC 4 LEVEL AI TỐI ƯU HÓA

> **💡 Lưu ý cho Khóa luận**: M-Bot **không lạm dụng AI**. Việc hở ra một chút là phải gọi lên Server API Gemini tốn chi phí cực đắt đỏ cho doanh nghiệp và tạo độ trễ cao. Để đưa vào Khóa luận chứng minh việc có tối ưu hóa hiệu năng và chi phí, hệ thống cung cấp công tắc **On/Off ở 4 mức độ**. Bằng cách thiết kế công tắc này tại biến môi trường `.env`, sinh viên có thể scale App từ một Hệ thống Rule-based Rẻ tiền đến một Agent trợ lý siêu đa năng.

*Tham khảo các tham số Mode:*
*   **Level 1 (Basic Regex Mode)**: Tiết kiệm tối đa. Dùng Regex tự viết cứng (`intentRegex.util.ts`) để nhận diện người dùng muốn hỏi cái gì ngay tại máy ảo, hoàn toàn bỏ qua bước LLM phân tích ở đầu vào. Tốn duy nhất 1 Request vào phút 89 để ráp câu trả lời. Trễ mạng gần như bằng 0.
*   **Level 2 (Smart Classification)**: Bật biến tắt LLM Classification. Hệ thống ủy quyền ngược cho AI phân loại ý định qua luồng Prompt. Nó vá lỗ hổng của Regex khi AI có thể hiểu cấu trúc câu hỏi xoáy đáp xoay hoặc câu nhiều ý ("Chỉ em lấy cái phone màu hường chơi game ầm ầm mà đừng cháy ví sếp ơi").
*   **Level 3 (Metadata Optimization)**: Bật tính năng RAG đặc biệt `SELF_QUERY`. LLM tự chẻ nhỏ câu chat thành một object trích xuất JSON các "Filters". (Ví dụ: `Price < 10000000`, `Brand = Apple`). Chộp Filter này ép vào DB Pinecone sẽ trả lại mảng vector chính xác 100%. Tối ưu cho thương mại điện tử.
*   **Level 4 (Full Agent Power)**: Bật `REWRITE` giúp sửa lỗi chính tả trước khi quét RAG và cho phép LLM chạy lướt Cào Mạng Web thực tế (Tavily/Google Search) nếu kho chứa database M-Bot vô tình hết hàng hoặc thiếu Model mới ra mắt. Gọi LLM tối đa, siêu chậm nhưng vô biên.

----

## 3. LUỒNG THỰC THI CHI TIẾT NHẤT (HẠT NHÂN CỦA BOT)
Quy trình từ lúc user gõ tin nhắn "Gửi" tới lúc Bot trả lời có thể chia làm các luồng xử lý cực kì chi tiết dưới đây.

### A. Giao diện tiếp nhận Controller
- App gọi `POST /api/v1/sessions/:id`, luồng chạy vào `chat.controller.ts`. 
- Thực hiện cởi lớp HTTP Body, Validating chuỗi rỗng trước khi đá trigger qua Trạm Điều Khiển: hàm `processUserQuery(question, sessionId)` ở tầng Service.

### B. Bước 1: Routing - Phân loại Ý định (Classify)
*Đây là chốt chặn quan trọng định hình đường lối giải quyết.* Hoạt động tại hàm `classifyUserQuery`.

1. **Fast-path (Bộ lọc cứng)**: Khởi đầu, hệ thống xài `greetingRegex`. Nếu là câu giao tiếp ầm ừ (hi, alo), hệ thống chốt nhãn `"casual_convo"` (Tán gẫu).
2. **Medium-path (Bộ lọc RegExp Cứng ngắc)**: Gõ "samsung, bao hanh, laptop", hệ thống lôi biểu thức Regular Expression từ file `intentRegex.util.ts` ra đối chiếu -> Chốt nhãn `"vector_store"` (Đây là câu hỏi dính dáng tới Kho hàng). Lúc này thành công rực rỡ việc ngắt chuỗi, không tốn 1 đồng API gọi AI phân loại!
3. **Slow-path (Dự phòng LLM)**: Khi Regex quỳ lạy do user viết lóng quá, hệ thống đưa cục text cho Gemini đọc và trả về 1 trong 3 nhãn: `"web_context"` (Ra mạng tìm), `"casual_convo"`, hoặc `"vector_store"`. 

### C. Bước 2: Phục hồi và Cổng Data (Retrieval)
Lúc này hệ thống đang cầm trong tay biến Routing Query Type.

**Trường hợp 1: QueryType là `"casual_convo"` (Câu xã giao)**
* Tắt DB chặn ngay từ cửa. LLM được mồi để tạo trực tiếp thông điệp chào hỏi và ngắt.

**Trường hợp 2: QueryType là `"vector_store"` (Lục tủ Cơ Sở Dữ Liệu)**
*Đoạn mã code đồ sộ nhất nằm ở khúc này, nó giao tiếp chéo nhiều lớp.*
1. **Lấy từ Vector Pinecone**: Kéo dữ liệu RAG mềm (luật hậu mãi, policy cửa hàng). Nếu Level 3 được bật, thuật toán `SelfQuery` đè filter tiền/kiểu lên Vector.
2. **Kéo API DB cứng**: Bot tự động kết nối Backend chính `http://localhost:5000/api/products`, ôm trọn mảng JSON chứa Toàn bộ máy móc thiết bị nhét vô biến `allProducts`. 
3. **Intent Injection (Tách nhu cầu bằng Thuật toán)**: Cắt gọt ý muốn người mua trong hàm `detectProductIntent`. VD: Nhận diện `wantsGaming = true`, parse được `budget = 24000000`, và bật cờ `wantsCheapest = false`.
4. **Ranking & Filtering (Chấm điểm Ưu tiên cho sản phẩm Mảng cứng)**: Dẹp hết mọi dòng lỗi. Các món thỏa mãn cấu hình sẽ đi qua ống nội soi `rankProduct`:
   - Nhân điểm cho những thiết bị mạnh RAM, mạnh Camera (Nếu khớp yêu cầu).
   - Hàm `pickCandidatesByBudget` tiếp nhận: Cân đong đo đếm ngân sách khách khứa. Nếu đủ tiền, chỉ trả về Top máy ngang với túi tiền của khách. Đặc biệt, phân luồng chặn bắt giá cực đoan: "rẻ nhất".
   => Trích xuất mảng `ProductCandidates` đẩy qua bước 3.

### D. Bước 3: Sinh mã trả lời Tùy biến (Generation)
ProductCandidates (Kèm object gốc), Context (Luật chính sách) và Câu hỏi gốc được đẩy vào cỗ máy Generator `generateAnswer`. Rẽ thành 2 đường tơ kẽ tóc:

* **Tối Kỵ Bypass LLM (Linh hồn Tối ưu tốc độ)**: Hệ thống check hàm `shouldBypassLLMForProductIntent`. Nếu user đang tra cứu đồ kiểu máy móc cực đoan ("cho anh máy rẻ nhất", "iphone nào chơi game đc"), chức năng gọi LLM nhả văn bị **vô hiệu hóa lập tức**. File code đâm luồng thẳng xuống hàm `buildCandidateOnlyResponse(...)`. Hàm này trích JSON bóc dữ dằn ra Array cho FrontEnd tự render thẻ sản phẩm lên màn hình, AI không tham gia dịch thuật mào đầu luyên thuyên. (Phiên chạy xong mất ~ 200-400ms).
* **Gọi ngầm LLM Chain (Default)**: LangChain (`createStreamingAnswerChain`) chốt sổ. AI phải xâu chuỗi thông tin tĩnh với dữ liệu động vắt óc suy nghĩ và format thành kiểu chữ json chặt chẽ thông qua hàm `enforceProductFallback` để ReactJS bên App đọc an toàn không lỗi giao diện.

----

## 4. PHÂN TÍCH GIẢI PHẪU CODE (CHI TIẾT TỪNG HÀM/FILE)

### 4.1. File Tổng Tư Lệnh: `src/services/chat.service.ts`
*Bộ phận não bộ điều phối dòng chảy của Flow RAG ở tầng Service.*

1. **`processUserQuery(question, sessionId)`**: Router khổng lồ. Gọi phân lớp, chẻ nhánh if/else cho đúng luồng dữ liệu trích xuất.
2. **`classifyUserQuery(...)`**: Check FastPath ưu tiên. Thất bại thì bật `initLLM()`, chạy chain `classificationChain.invoke()`.
3. **`generateAnswer(...)`**: Tổng thầu ngã rẽ. Kích hoạt Bypass qua `buildCandidateOnlyResponse`, hoặc quẹo xuống `streamingChain` của LLM. Trấn giữ bảo tồn Response bằng ngàm Fallback `enforceProductFallback(...)` khiến Data về Frontend không bao giờ đứt.
4. **`buildProductCandidatesFromBackend(...)`**: Đội bắt cá. Móc API Server chính Backend. Chạy vòng lặp `.filter()`, `.map()` thông qua `rankProduct` để rải điểm thí sinh thiết bị. Trả về đúng Array chuẩn.

### 4.2. File Năng Lực Trí Não Cơ Học: `src/utils/ranking.util.ts`
*(Trọng tâm báo cáo khóa luận cho thấy sự khéo léo xử lý JS mà không hoàn toàn dựa dẫm LLM).*

1. **`detectProductIntent(question)`**: Quét Regex gỡ nhu cầu ẩn. Chuyển đổi String lóng qua dạng số (VD: "22 củ" -> 22000000, "15 triệu rưỡi" -> 15500000). Châm ngòi flag boolean Rẻ Nhất (`wantsCheapest`).
2. **`rankProduct(product, intent)`**: Bộ biến đổi `score`. Chạm trán từng dòng Spec (`"CPU"`, `"RAM (GB)"`). Nếu khách muốn bắn súng, hệ lượng hóa điểm RAM và CPU chèn vượt mức so với con điểm đồ họa văn phòng.
3. **`pickCandidatesByBudget(products, budget, limit, wantsCheapest)`**: Màng lọc phễu sinh tồn. Lọc khoảng ngắm bằng tỷ số $75\% \times budget \le price \le budget$. (Người nghèo có 10tr thì tìm điện thoại 7.5 triệu -> 10 triệu để dễ chốt đơn).  **Lưu ý đặc biệt**: Nếu `wantsCheapest=true`, bóp bẹp thuật toán Sort theo Array Giá. Nhấc con ở tận cùng Đáy Của Đáy Mức Giá trích xuất mảng với giới hạn `slice(0, 1)`, triệt hoàn toàn lải nhải nhồi nhét cho khách.

### 4.3. File Tự Động Hóa Bộ Lọc: `src/utils/intentRegex.util.ts`
*Tường Thành Đầu Tiên. Lọc trước khi tới Trí Tuệ Nhân Tạo.*

- Export hệ thống Pattern mảng chữ được Compiled trực tiếp trên mem engine V8.
- Regex: `/^(chao\s*(anh|chi|em|ban|shop)?|hi|hello|hey|yo|alo|xin chao|chao buoi sang)(\s+|$)/i`. Trực tiếp Bypass LLM những câu chào lác đác làm bẩn Cache Hệ thống. Gánh áp lực Sever, dù Gemini bị treo API thì Bot chán nản vẫn trả lời lại "Xin Chào" ngon ơ.

---

## 5. VÍ DỤ CASE STUDY THỰC TẾ (WALKTHROUGH PHÂN RÃ LUỒNG)

*(Phân đoạn có thể demo bằng Console cho thầy kiểm chứng sự logic tuyệt đỉnh của hệ thống RAG - Bớt lạm phát Request).*

### Kịch bản 1: Khách hàng dạo chơi: *"Hello rảnh ko"* -> (Fast Path Siêu Nhanh)
- **Controller gọi**: `processUserQuery("Hello rảnh ko")`.
- **Cơ chế hoạt động**: Hàm check Regex `isCasualConversationQuestion` của file `intentRegex.util.ts` chộp nháy chữ `"Hello"`. Từ chối chuyển dữ liệu đi đâu rườm rà. Lập tức Return cờ `"casual_convo"`. 
- **Kết thúc**: Cờ này được tống xuống `generateAnswer`, LLM được kêu ríu rắt sinh chữ "Chào bạn M-Bot đang rảnh" kết thúc phiên. Giao dịch siêu rẻ, API call gần như tốn tí ti millisecond.

### Kịch bản 2: Bẫy Săn Khách Cáo Già: *"Tui có 15 củ rưỡi, tìm phone nào rẻ nhất giùm, tui ko thích chém gió"* -> (Kỹ Nghệ Bypass Hoàn Toàn RAG Phức Tạp)
- **Controller Action**: Chữ gõ cộc cằn nhằn nhò quá dài -> Regex bó tay rụng gãy. Chạy hàm dự phòng: LLM Gemini flash xộc vào.
- **Phân loại nhánh**: LLM thấy chữ "phone" và cụm "15 củ rưỡi" -> Phát hiệu cờ định tuyến lệnh xuống: Đứa cháu này tính tiền chốt đơn mua hàng đây rồi, thẻ định danh `"vector_store"` khởi chạy!
- **Gọi Trợ Thủ API DB**: M-Bot Backend cắm ống thở sang Backend E-commerce gốc, chải 1 phệt cào về JSON 36 cái điện thoại.
- **Tính toán Lõi (`detectProductIntent`) Cắt Gọt**:
    - Parsing dòng tiền: Chữ `15 củ rưỡi` bị xé nát quăng vô biển số học -> Tạo Array biến `15,500,000` VNĐ.
    - Parsing Cờ hiệu: Chộp được Ý đồ Điện thoại (`wantsPhone=true`).
    - Parsing Kiểu Khách: Bắt quả tang chữ rẻ nhất -> Cờ `wantsCheapest=true` găm chốt.
- **Mở Bộ Lọc Lưới Chấm Điểm (`rankProduct` & `pickByBudget`)**:
    - Phế bỏ phũ phàng mọi Model máy lạnh, màn hình, TV trong danh sách 36 món.
    - Nhìn thấy cờ Rẻ Nhất (Cheapest). Nó liền quăng cái Ngân Sách 15.5 củ vô sọt rác, búng qua hàm Array Sort, xếp đống Điện thoại từ Thấp Bé Nhẹ Cân -> Đắt Đỏ. Nó xẻo đúng Cú Đáy Số 0: Một cái Điện thoại Nokia đen trắng cũ 1.2tr và găm chặt vô Card Số 1 để chưng diện.
- **Phép Màu Sinh Mã (Generation Phase)**: Thuật toán Tối Kỵ `shouldBypassLLM` sáng rực đèn vì nó bắt gặp cờ Rẻ Nhất / Tìm cấu hình ngầm. Lập tức **KHÓA mõm LLM Gemini lại**. Không cho AI sinh chữ nhả văn nữa. Nó chọc lút cán thẳng vô cục sườn Hàm cứng bằng mã Code `buildCandidateOnlyResponse`. Hàm này tự biên tự diễn cái chuỗi Tĩnh "Đã tìm thấy 1 mẫu giá hợp nhất: Nokia 1". Tống mảng JSON đó bắn thẳng vô họng Frontend.
- **Frontend App Hiện Thực**: Phép ReactJS cắn `isListFormat` lật mặt nháy phát render giao diện 1 cái Card điện thoại duy nhất. 
=> **Đọc log**: LLM Generation = KHÔNG GỌI, Vector Index = GỌI SIÊU NHANH. Thời gian tổng tốn ~450ms. Bơm thẳng vào tim Khóa luận về Hiệu Quả Tối Ưu Hệ Thống Server Cục Bộ kết hợp API Đám Mây Mảnh.

**HOÀN TẤT LÝ THUYẾT.** Bộ móng vuốt M-Bot vững chắc.
