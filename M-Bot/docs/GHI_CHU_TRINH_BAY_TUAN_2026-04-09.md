# GHI CHÚ TRÌNH BÀY (DỄ HIỂU) - TUẦN 09/04/2026

## 1) Mục tiêu tuần này em đã làm gì?
- Trước đây chatbot thiên về gợi ý sản phẩm, trả lời chưa tốt các câu hỏi ngoài sản phẩm.
- Tuần này em tập trung làm để chatbot:
  - Hiểu câu hỏi tốt hơn theo ngữ cảnh.
  - Trả lời được câu hỏi kiến thức chung.
  - Trả lời được FAQ/chính sách (đặc biệt chính sách bảo mật).
  - Không trả lời sai kiểu “câu nào cũng gợi ý điện thoại”.

---

## 2) Giải thích kỹ từng ý trong phần “ĐÃ HOÀN THÀNH TUẦN NÀY”

### Ý 1: Thêm luồng AI phân tích câu hỏi và viết lại truy vấn
Nói dễ hiểu:
- Khi user hỏi, chatbot có 2 việc trước khi trả lời:
  1. Xác định câu hỏi này thuộc loại nào (hỏi sản phẩm, hỏi web, hay hỏi xã giao).
  2. Viết lại câu hỏi ngắn gọn hơn để dễ tìm dữ liệu.

Vì sao cần:
- Nếu không phân loại, bot dễ chọn sai nguồn dữ liệu.
- Nếu không viết lại truy vấn, retrieval có thể tìm sai tài liệu.

Kết quả:
- Bot hiểu câu hỏi theo ngữ cảnh hội thoại tốt hơn, không còn phụ thuộc hoàn toàn vào rule cứng.

---

### Ý 2: Kích hoạt retrieval nâng cao theo ngữ nghĩa + metadata
Nói dễ hiểu:
- Trước đây giống “tìm từ khóa gần giống”.
- Bây giờ thêm khả năng lọc theo metadata (loại tài liệu, chính sách nào, giá, danh mục...).

Ví dụ:
- Hỏi về chính sách thì ưu tiên tài liệu `policy`.
- Hỏi sản phẩm điện thoại dưới 15 triệu thì có thể lọc theo category + price.

Kết quả:
- Tài liệu lấy ra liên quan hơn, nên câu trả lời chính xác hơn.

---

### Ý 3: Tích hợp luồng web context (Tavily + Google CSE)
Nói dễ hiểu:
- Nếu câu hỏi nằm ngoài dữ liệu nội bộ shop (ví dụ kiến thức chung),
  bot sẽ lấy thêm thông tin từ web rồi mới trả lời.

Ví dụ:
- “Thương mại điện tử là gì?” không phải thông tin sản phẩm nội bộ.
- Bot đi web context và trả lời theo nguồn web.

Kết quả:
- Bot không bị “bí” ở các câu hỏi ngoài domain bán hàng.

---

### Ý 4: Bổ sung luồng hỏi đáp chính sách/FAQ, ưu tiên tài liệu chính sách
Nói dễ hiểu:
- Khi user hỏi đổi trả, bảo hành, giao hàng, thanh toán, bảo mật...
  bot ưu tiên đọc tài liệu policy/faq trước.

Vì sao cần:
- Tránh trường hợp hỏi chính sách mà bot lại đi gợi ý sản phẩm.

Kết quả:
- Nhóm câu hỏi vận hành cửa hàng trả lời đúng hướng hơn.

---

### Ý 5: Thêm dữ liệu chính sách bảo mật thông tin
Nói dễ hiểu:
- Em bổ sung thêm nội dung chính sách bảo mật vào kho dữ liệu để bot có cái mà trả lời.

Kết quả:
- Các câu hỏi như “shop lưu dữ liệu cá nhân thế nào?” đã có dữ liệu nền để trả lời.

---

### Ý 6: Chỉnh logic để không ép fallback sản phẩm sai ngữ cảnh
Nói dễ hiểu:
- Trước đây có cơ chế “nếu không chắc thì gợi ý vài sản phẩm”.
- Cơ chế này làm sai ngữ cảnh ở câu không phải mua hàng.

Tuần này sửa:
- Chỉ fallback sản phẩm khi thật sự là câu hỏi mua hàng/product intent.
- Câu hỏi policy/FAQ/general thì không ép sản phẩm.

Kết quả:
- Giảm trả lời lệch chủ đề.

---

## 3) Luồng đi của chatbot (trình bày cho người mới)

### Luồng tổng quát
1. User gửi câu hỏi ở FE.
2. Backend nhận câu hỏi, lưu session/conversation.
3. Bot phân loại câu hỏi:
   - `vector_store` (dữ liệu nội bộ)
   - `web_context` (kiến thức ngoài)
   - `casual_convo` (xã giao)
4. Nếu cần, bot viết lại truy vấn để tìm tốt hơn.
5. Bot truy xuất dữ liệu:
   - Từ Pinecone (product/faq/policy)
   - Hoặc từ web (Tavily + Google CSE)
6. Bot tạo câu trả lời JSON chuẩn:
   - `isListFormat`
   - `products`
   - `responseText`
7. FE nhận kết quả và hiển thị cho user.

---

### Luồng cụ thể theo loại câu hỏi
- Câu hỏi sản phẩm:
  - Ưu tiên vector + ranking theo nhu cầu (gaming/camera/ngân sách).
  - Trả danh sách máy + lý do chọn.

- Câu hỏi chính sách/FAQ:
  - Ưu tiên tài liệu policy/faq.
  - Trả lời theo nội dung chính sách.

- Câu hỏi kiến thức chung:
  - Đi web context.
  - Tổng hợp nguồn rồi trả lời ngắn gọn.

---

## 4) Những điểm em đã làm thêm để demo “đẹp” hơn
- Tin nhắn sản phẩm hiển thị rõ:
  - Tên sản phẩm + giá.
  - Thông số ngắn theo nhu cầu (game/camera).
  - Link xem chi tiết sản phẩm.
- Thêm hiệu ứng “đang trả lời” (3 chấm) trong khung chat FE.
- Sửa text tiếng Việt có dấu để nhìn chuyên nghiệp hơn khi demo.

---

## 5) Các vấn đề thực tế em đã gặp và cách xử lý
- Lỗi 500 do MongoDB local chưa chạy:
  - Đã kiểm tra service MongoDB và sửa backend theo hướng fail-fast để báo lỗi rõ hơn.

- Lỗi 429 quota Gemini:
  - Do free-tier giới hạn số request.
  - Đã thêm hướng chạy tiết kiệm quota (tắt bớt classify/rewrite/self-query khi cần demo).

- Lỗi 403 leaked API key:
  - Key bị Google đánh dấu lộ.
  - Đã đổi key mới và nhắc quy trình bảo mật key.

---

## 6) Cách nói ngắn gọn khi thầy hỏi “tuần này em làm được gì?”
- “Em hoàn thiện chatbot theo hướng trả lời đa nhiệm: không chỉ tư vấn sản phẩm mà còn trả lời FAQ/chính sách và kiến thức chung.”
- “Em nâng cấp retrieval để lấy đúng tài liệu hơn, đồng thời sửa logic để tránh trả lời lệch chủ đề.”
- “Em bổ sung dữ liệu chính sách bảo mật và cải thiện UI chat để hiển thị kết quả rõ, chuyên nghiệp hơn.”
- “Em cũng xử lý các rủi ro vận hành thực tế như lỗi MongoDB, quota AI và API key bị khóa.”

---

## 7) Checklist trước khi đi báo cáo
- [ ] Chạy backend thành công, MongoDB đang chạy.
- [ ] Test 3 câu demo:
  - Câu sản phẩm: “Điện thoại dưới 15 triệu chơi game tốt?”
  - Câu chính sách: “Chính sách bảo mật thông tin là gì?”
  - Câu kiến thức chung: “Thương mại điện tử là gì?”
- [ ] Kiểm tra FE hiển thị đúng:
  - Có danh sách sản phẩm.
  - Có thông số ngắn.
  - Có link chi tiết.
  - Có animation đang trả lời.
