BÁO CÁO TIẾN ĐỘ TUẦN - CHATBOT RAG TECHSTORE
Ngày: 28/3/2026

I. HỆ THỐNG

\- Mục tiêu: Chatbot tư vấn sản phẩm cho TechStore sử dụng RAG

\- Stack: Angular + .NET/SQL Server + Bun/Express/LangChain + Pinecone + Tavily + Gemini



II. ĐÃ HOÀN THÀNH TUẦN NÀY

\- Hệ thống lọc sản phẩm động: Giảm hardcode, chuyển sang file config

\- Chuẩn hóa thuộc tính kỹ thuật: Schema chuẩn cho 11 thuộc tính (CPU, RAM, Camera, Pin...)

\- Tự động phát hiện ý định: gaming, camera, pin từ câu hỏi người dùng

\- Phân tích ngân sách và lọc sản phẩm phù hợp

Tiến độ: Backend 92% | Frontend 90% | Retrieval 90% | Chất lượng trả lời 80%



III. KẾ HOẠCH TUẦN TỚI

1. Tavily tra cứu ngược database - tích hợp search engine để verify thông tin
2. Thêm luồng chính sách/bảo mật - endpoint riêng cho policy/warranty queries
3. Tối ưu retrieval (filter theo category/price/brand trong Pinecone)
4. Cải thiện hiệu năng (caching, query optimization)



IV. RỦI RO

\- Quota API miễn phí (Gemini/Pinecone) → chuẩn bị key dự phòng + fallback logic

