# Dropbox RAG Setup Guide (MIỄN PHÍ - KHÔNG CẦN VISA)

## Ưu điểm Dropbox
- ✅ Hoàn toàn miễn phí
- ✅ KHÔNG cần thẻ visa/credit card
- ✅ Dễ setup hơn Google Drive
- ✅ API đơn giản

## Bước 1: Tạo Dropbox App

1. Truy cập: https://www.dropbox.com/developers/apps
2. Click "Create app"
3. Chọn:
   - API: "Scoped access"
   - Type of access: "App folder" (chỉ access 1 folder riêng)
   - Name: `rag-chatbot-app` (tên tùy ý)
4. Click "Create app"

## Bước 2: Lấy Access Token

1. Trong app vừa tạo, tab "Settings"
2. Scroll xuống "OAuth 2"
3. Section "Generated access token"
4. Click "Generate" button
5. Copy token (dạng: `sl.B1a2b3c4d5e6f7g8h9i0j...`)

⚠️ **LƯU Ý:** Token này chỉ hiện 1 lần, hãy lưu lại!

## Bước 3: Set Permissions

1. Tab "Permissions"
2. Enable các quyền:
   - ✅ `files.metadata.read`
   - ✅ `files.content.read`
3. Click "Submit" ở cuối trang

## Bước 4: Upload files vào Dropbox

1. Mở Dropbox app hoặc web: https://www.dropbox.com/
2. Vào folder "Apps" > "rag-chatbot-app"
3. Upload các file:
   - PDF: Catalog, hướng dẫn
   - DOCX: Chính sách
   - TXT: Thông tin bổ sung

Ví dụ:
```
Apps/rag-chatbot-app/
├── chinh-sach-bao-hanh.pdf
├── huong-dan-su-dung.docx
├── catalog-san-pham.pdf
└── thong-tin-cua-hang.txt
```

## Bước 5: Cấu hình .env

```bash
# .env
DROPBOX_ENABLED=true
DROPBOX_ACCESS_TOKEN=sl.B1a2b3c4d5e6f7g8h9i0j...
DROPBOX_FOLDER_PATH=/
```

**Giải thích:**
- `DROPBOX_FOLDER_PATH=/` : Đọc tất cả files trong app folder
- Hoặc `/subfolder` : Chỉ đọc subfolder cụ thể

## Bước 6: Test

```bash
# Start server
bun run start

# Sync documents
curl -X POST http://localhost:3000/api/v1/products/sync

# Check logs
# [Dropbox] Found X files
# [Dropbox] Downloaded: file1.pdf
# [VectorStore] Synced ... Dropbox docs
```

## So sánh với Google Drive

| Tính năng | Google Drive | Dropbox |
|-----------|--------------|---------|
| Miễn phí | ✅ (cần visa) | ✅ (không cần visa) |
| Setup | Phức tạp | Đơn giản |
| Token | Service Account JSON | Access Token string |
| Permissions | Share folder | Auto (app folder) |
| Phù hợp | Enterprise | Cá nhân/Startup |

## Troubleshooting

### Lỗi: "Invalid access token"
- Token đã hết hạn → Generate token mới
- Check đã copy đúng token chưa

### Lỗi: "Permission denied"
- Check đã enable permissions trong app settings
- Click "Submit" sau khi enable

### Không thấy files
- Check files đã upload vào đúng folder "Apps/rag-chatbot-app"
- Check DROPBOX_FOLDER_PATH có đúng không

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- KHÔNG commit token vào Git
- Thêm vào .gitignore:
  ```
  .env
  .env.local
  ```
- Token có thể revoke và generate lại bất cứ lúc nào
