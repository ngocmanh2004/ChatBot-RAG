# Google Drive RAG Setup Guide

## Bước 1: Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Google Drive API:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google Drive API"
   - Click "Enable"

## Bước 2: Tạo Service Account

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Điền thông tin:
   - Service account name: `rag-chatbot-service`
   - Service account ID: `rag-chatbot-service`
   - Click "Create and Continue"
4. Grant role: "Viewer" (hoặc "Editor" nếu cần write)
5. Click "Done"

## Bước 3: Tạo Service Account Key

1. Click vào service account vừa tạo
2. Tab "Keys" > "Add Key" > "Create new key"
3. Chọn "JSON"
4. Download file JSON (ví dụ: `rag-chatbot-service-key.json`)

## Bước 4: Tạo Google Drive Folder

1. Vào Google Drive: https://drive.google.com/
2. Tạo folder mới (ví dụ: "RAG Documents")
3. Copy Folder ID từ URL:
   ```
   https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
                                          ^^^^^^^^^^^^^^^^^^^^
                                          Đây là Folder ID
   ```

## Bước 5: Share Folder với Service Account

1. Right-click folder "RAG Documents"
2. Click "Share"
3. Paste email của service account (ví dụ: `rag-chatbot-service@project-id.iam.gserviceaccount.com`)
4. Chọn role "Viewer" (hoặc "Editor")
5. Click "Share"

## Bước 6: Cấu hình .env

### Cách 1: Dùng file JSON (đơn giản)

```bash
# .env
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j

# Copy toàn bộ nội dung file JSON vào 1 dòng
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"rag-chatbot-service@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

### Cách 2: Dùng file riêng (an toàn hơn)

```bash
# .env
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_DRIVE_KEY_FILE=./google-drive-key.json
```

Sau đó copy file JSON vào `M-Bot/google-drive-key.json`

## Bước 7: Upload files vào Google Drive

1. Vào folder "RAG Documents" trên Google Drive
2. Upload các file:
   - PDF: Catalog sản phẩm, hướng dẫn
   - DOCX: Chính sách chi tiết
   - TXT: Thông tin bổ sung

Ví dụ:
```
RAG Documents/
├── chinh-sach-bao-hanh-2026.pdf
├── huong-dan-su-dung-techstore.docx
├── catalog-dien-thoai.pdf
└── thong-tin-cua-hang.txt
```

## Bước 8: Test

```bash
# Start server
bun run start

# Sync documents
curl -X POST http://localhost:3000/api/v1/products/sync

# Check logs
# Bạn sẽ thấy:
# [GoogleDrive] Found X supported files
# [GoogleDrive] Downloaded: file1.pdf
# [GoogleDrive] Loaded Y document chunks from X files
# [VectorStore] Synced ... Google Drive docs
```

## Bước 9: Test chatbot

Hỏi chatbot về nội dung trong files:
```
User: "Chính sách bảo hành của TechStore như thế nào?"
Bot: [Trả lời dựa trên file PDF đã upload]
```

## Troubleshooting

### Lỗi: "Missing GOOGLE_DRIVE_CREDENTIALS"
- Check file .env có GOOGLE_DRIVE_CREDENTIALS chưa
- Check format JSON có đúng không (phải là 1 dòng)

### Lỗi: "Failed to list files"
- Check đã share folder với service account chưa
- Check GOOGLE_DRIVE_FOLDER_ID có đúng không
- Check service account có quyền "Viewer" trên folder

### Lỗi: "Failed to download"
- Check file có tồn tại trong folder không
- Check service account có quyền đọc file không

### Không thấy documents trong vector store
- Check AUTO_SYNC_ON_START=true trong .env
- Hoặc gọi API sync thủ công: `POST /api/v1/products/sync`
- Check logs để xem có lỗi không

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- KHÔNG commit file JSON key vào Git
- Thêm vào .gitignore:
  ```
  google-drive-key.json
  *-key.json
  ```
- Dùng environment variables cho production
- Rotate key định kỳ (3-6 tháng)

## So sánh Local vs Google Drive

| Tính năng | Local Folder | Google Drive |
|-----------|--------------|--------------|
| Setup | Đơn giản | Cần config API |
| Quản lý | Copy file thủ công | Upload qua web |
| Chia sẻ | Khó (cần access server) | Dễ (share link) |
| Backup | Thủ công | Tự động (Drive) |
| Phù hợp | Development | Production |

## Khuyến nghị

**Development:** Dùng local folder (đơn giản)
**Production:** Dùng Google Drive (dễ quản lý, team collaboration)
**Hybrid:** Dùng cả 2 (local cho test, Drive cho production data)
