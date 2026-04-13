# HƯỚNG DẪN HIỂU HỆ THỐNG M-BOT CHO NGƯỜI MỚI

## 📚 MỤC LỤC
1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Luồng hoạt động chính](#3-luồng-hoạt-động-chính)
4. [Chi tiết từng layer](#4-chi-tiết-từng-layer)
5. [Các khái niệm quan trọng](#5-các-khái-niệm-quan-trọng)
6. [Ví dụ cụ thể](#6-ví-dụ-cụ-thể)

---

## 1. TỔNG QUAN HỆ THỐNG

### M-Bot là gì?
M-Bot là một **RAG Chatbot** (Retrieval-Augmented Generation) - tức là chatbot thông minh có khả năng:
- **Tìm kiếm thông tin** từ database/documents (Retrieval)
- **Tạo câu trả lời** dựa trên thông tin tìm được (Generation)

### Công nghệ sử dụng
- **Runtime**: Bun (JavaScript runtime nhanh hơn Node.js)
- **Framework**: Express.js (Web framework)
- **AI/LLM**: Google Gemini (Model AI để tạo câu trả lời)
- **Vector DB**: Pinecone (Lưu trữ và tìm kiếm tài liệu)
- **Database**: MongoDB (Lưu lịch sử chat)
- **RAG Framework**: LangChain (Framework xây dựng RAG)

### Vai trò trong hệ thống
```
User (TechStore_FE) 
    ↓ gửi câu hỏi
M-Bot (Backend RAG)
    ↓ lấy dữ liệu sản phẩm
TechStore_BE (Backend chính)
```


---

## 2. CẤU TRÚC THỨ MỤC

```
M-Bot/
├── server.ts                    # 🚀 File khởi động server (ĐIỂM BẮT ĐẦU)
├── .env                         # 🔐 Biến môi trường (API keys, config)
├── package.json                 # 📦 Danh sách thư viện cần cài
│
├── src/
│   ├── routes/                  # 🛣️ Định nghĩa các API endpoint
│   │   └── chat.route.ts        # Route cho chat (/api/v1/sessions)
│   │
│   ├── controller/              # 🎮 Xử lý request từ client
│   │   ├── chat.controller.ts   # Controller chat chính
│   │   └── products.controller.ts
│   │
│   ├── services/                # 🧠 Logic nghiệp vụ (PHẦN QUAN TRỌNG NHẤT)
│   │   ├── chat.service.ts      # ⭐ Core RAG logic
│   │   ├── vectorStore.service.ts  # Tìm kiếm trong Pinecone
│   │   ├── product.service.ts   # Lấy dữ liệu sản phẩm
│   │   ├── dropbox.service.ts   # Đọc file từ Dropbox
│   │   ├── faq.service.ts       # Lấy FAQ từ database
│   │   └── conversations.service.ts  # Lưu lịch sử chat
│   │
│   ├── config/                  # ⚙️ Cấu hình kết nối
│   │   ├── llm.config.ts        # Cấu hình Google Gemini
│   │   ├── pinecone.config.ts   # Cấu hình Pinecone
│   │   ├── mongodb.config.ts    # Cấu hình MongoDB
│   │   └── product.config.ts    # Cấu hình specs sản phẩm
│   │
│   ├── utils/                   # 🔧 Công cụ hỗ trợ
│   │   ├── chain.util.ts        # Tạo LangChain chains
│   │   ├── prompt.util.ts       # Template prompt cho AI
│   │   ├── ranking.util.ts      # Xếp hạng sản phẩm
│   │   └── spec.util.ts         # Xử lý thông số kỹ thuật
│   │
│   ├── models/                  # 📋 Định nghĩa kiểu dữ liệu
│   │   ├── message.model.ts
│   │   └── product.model.ts
│   │
│   └── validation/              # ✅ Kiểm tra dữ liệu đầu vào
│       └── auth.validation.ts
│
├── documents/                   # 📄 Thư mục chứa file tài liệu local
└── docs/                        # 📖 Tài liệu hướng dẫn

---

## 3. LUỒNG HOẠT ĐỘNG CHÍNH

### 3.1. Khởi động server (server.ts)

```
1. server.ts chạy
   ↓
2. Kết nối MongoDB (lưu lịch sử chat)
   ↓
3. Load documents từ ./documents folder
   ↓
4. Load documents từ Dropbox
   ↓
5. Sync tất cả documents vào Pinecone (vector database)
   ↓
6. Khởi động Express server ở port 3000
   ↓
7. Đăng ký routes (API endpoints)
```

**File liên quan:** `server.ts`, `src/config/*.ts`

---

### 3.2. User gửi câu hỏi (Flow chính)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER GỬI CÂU HỎI                                         │
│    POST /api/v1/sessions/{sessionId}                        │
│    Body: { "message": "Tìm điện thoại chơi game 15 triệu" }│
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ROUTE NHẬN REQUEST                                       │
│    File: src/routes/chat.route.ts                           │
│    Function: router.post('/sessions/:sessionId')            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER XỬ LÝ                                         │
│    File: src/controller/chat.controller.ts                  │
│    Function: streamMessageController()                      │
│    - Validate input                                         │
│    - Gọi service xử lý                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SERVICE XỬ LÝ RAG (PHẦN QUAN TRỌNG NHẤT)                │
│    File: src/services/chat.service.ts                       │
│    Function: processUserQuery()                             │
└─────────────────────────────────────────────────────────────┘
```


---

## 4. CHI TIẾT TỪNG LAYER

### 4.1. LAYER 1: Routes (Định nghĩa API)

**File:** `src/routes/chat.route.ts`

**Chức năng:** Định nghĩa các endpoint API mà client có thể gọi

**Các endpoint:**
```typescript
POST /api/v1/sessions              // Tạo session mới
POST /api/v1/sessions/:sessionId   // Gửi tin nhắn chat
GET  /api/v1/products/preview      // Xem dữ liệu sản phẩm
POST /api/v1/products/sync         // Đồng bộ lại vector store
```

**Ví dụ:**
```typescript
// Khi client gọi: POST /api/v1/sessions/abc123
router.post('/sessions/:sessionId', streamMessageController);
// → Sẽ chuyển request tới streamMessageController
```

---

### 4.2. LAYER 2: Controllers (Xử lý request)

**File:** `src/controller/chat.controller.ts`

**Chức năng:** 
- Nhận request từ route
- Validate dữ liệu đầu vào
- Gọi service xử lý logic
- Trả response về client

**Function chính:** `streamMessageController()`

```typescript
export const streamMessageController = async (req, res) => {
  // 1. Lấy sessionId và message từ request
  const { sessionId } = req.params;
  const { message } = req.body;
  
  // 2. Validate
  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }
  
  // 3. Gọi service xử lý (PHẦN QUAN TRỌNG)
  const result = await processUserQuery(message, sessionId);
  
  // 4. Trả kết quả về client
  res.json({ response: result });
}
```


---

### 4.3. LAYER 3: Services (Logic nghiệp vụ) ⭐ QUAN TRỌNG NHẤT

#### A. chat.service.ts - Core RAG Logic

**File:** `src/services/chat.service.ts`

**Function chính:** `processUserQuery(question, sessionId)`

**Luồng xử lý chi tiết:**

```typescript
async function processUserQuery(question, sessionId) {
  
  // BƯỚC 1: PHÂN LOẠI CÂU HỎI
  // Xác định câu hỏi thuộc loại nào
  const queryType = await classifyUserQuery(question, sessionId);
  // Kết quả: "vector_store" | "web_context" | "casual_convo"
  
  // BƯỚC 2: XỬ LÝ THEO LOẠI
  
  if (queryType === "casual_convo") {
    // Câu hỏi xã giao: "Xin chào", "Cảm ơn"
    return generateAnswer(question, "", sessionId);
  }
  
  if (queryType === "vector_store") {
    // Câu hỏi về sản phẩm/chính sách
    
    // 2.1. Tìm kiếm trong Pinecone
    const docs = await queryCombinedResult(question, sessionId);
    
    // 2.2. Lấy dữ liệu sản phẩm từ TechStore_BE
    const products = await buildProductCandidatesFromBackend(question);
    
    // 2.3. Xếp hạng sản phẩm theo intent
    const rankedProducts = rankProduct(products, intent);
    
    // 2.4. Tạo câu trả lời
    return generateAnswer(question, context, sessionId, products);
  }
  
  if (queryType === "web_context") {
    // Câu hỏi cần tìm trên internet
    const webContext = await buildExternalWebContext(question);
    return generateAnswer(question, webContext, sessionId);
  }
}
```

**Các function con quan trọng:**

1. **classifyUserQuery()** - Phân loại câu hỏi
   - Input: "Tìm điện thoại chơi game"
   - Output: "vector_store" (cần tìm trong database)

2. **detectProductIntent()** - Phát hiện ý định
   - Input: "Tìm điện thoại chơi game 15 triệu"
   - Output: { wantsGaming: true, budget: 15000000 }

3. **buildProductCandidatesFromBackend()** - Lấy sản phẩm
   - Gọi API TechStore_BE: GET /api/products
   - Lọc sản phẩm còn hàng
   - Xếp hạng theo specs

4. **generateAnswer()** - Tạo câu trả lời
   - Gọi Google Gemini AI
   - Trả về JSON format cho frontend


---

#### B. vectorStore.service.ts - Tìm kiếm trong Pinecone

**File:** `src/services/vectorStore.service.ts`

**Chức năng:** Quản lý vector database (Pinecone)

**Function chính:**

1. **syncAllDocumentsToVectorStore()** - Đồng bộ dữ liệu
```typescript
async function syncAllDocumentsToVectorStore() {
  // Lấy tất cả documents từ các nguồn
  const productDocs = await getAllProductDocuments();    // Từ TechStore_BE
  const faqDocs = await getAllFaqDocuments();            // Từ database
  const policyDocs = await getAllPolicyDocuments();      // Từ database
  const dropboxDocs = await getAllDropboxDocuments();    // Từ Dropbox
  
  // Gộp lại
  const allDocs = [...productDocs, ...faqDocs, ...policyDocs, ...dropboxDocs];
  
  // Đưa vào Pinecone
  await vectorStore.addDocuments(allDocs);
}
```

2. **queryCombinedResult()** - Tìm kiếm
```typescript
async function queryCombinedResult(query, sessionId) {
  // Tìm kiếm theo 2 cách:
  // 1. Self-query: AI tự động tạo filter
  const selfQueryResult = await searchDocumentsWithSelfQuery(query);
  
  // 2. Similarity search: Tìm theo độ tương đồng
  const similarityResult = await searchSimilarDocuments(query);
  
  // Gộp kết quả và loại trùng
  return [...selfQueryResult, ...similarityResult];
}
```

---

#### C. product.service.ts - Lấy dữ liệu sản phẩm

**File:** `src/services/product.service.ts`

**Chức năng:** Giao tiếp với TechStore_BE để lấy dữ liệu sản phẩm

**Function chính:**

1. **fetchAllProducts()** - Lấy tất cả sản phẩm
```typescript
async function fetchAllProducts() {
  // Gọi API TechStore_BE
  const response = await axios.get('http://localhost:5000/api/products');
  
  // Chuẩn hóa dữ liệu
  return response.data.map(product => ({
    product_id: product.product_id,
    product_name: product.product_name,
    price: product.price,
    specifications: {
      "CPU": product.cpu_chip,
      "RAM (GB)": product.ram_gb,
      "Storage (GB)": product.storage_gb,
      // ... các specs khác
    }
  }));
}
```

2. **fetchProductDetails()** - Lấy chi tiết 1 sản phẩm
```typescript
async function fetchProductDetails(productId) {
  const response = await axios.get(`http://localhost:5000/api/products/${productId}`);
  return response.data;
}
```


---

#### D. dropbox.service.ts - Đọc file từ Dropbox

**File:** `src/services/dropbox.service.ts`

**Chức năng:** Tải và xử lý file từ Dropbox

**Function chính:**

1. **loadDocumentsFromDropbox()** - Tải tất cả file
```typescript
async function loadDocumentsFromDropbox() {
  // 1. List files từ Dropbox
  const files = await listFilesFromDropbox();
  // Kết quả: ["chinh-sach-bao-hanh.txt", "chinh-sach-doi-tra.txt", ...]
  
  // 2. Download từng file
  for (const file of files) {
    const localPath = await downloadFileFromDropbox(file.path, file.name);
    
    // 3. Load nội dung file
    const docs = await loadDocumentFromFile(localPath);
    
    // 4. Chia nhỏ thành chunks
    const chunks = await splitDocuments(docs);
    
    allDocs.push(...chunks);
  }
  
  return allDocs;
}
```

**Tại sao cần chia chunks?**
- File dài không thể đưa hết vào AI
- Chia nhỏ giúp tìm kiếm chính xác hơn
- Mỗi chunk ~1000 ký tự

---

#### E. conversations.service.ts - Lưu lịch sử

**File:** `src/services/conversations.service.ts`

**Chức năng:** Quản lý lịch sử chat trong MongoDB

**Function chính:**

1. **getChatHistory()** - Lấy lịch sử chat
```typescript
async function getChatHistory(sessionId) {
  // Lấy 10 tin nhắn gần nhất
  return chatHistory.get(sessionId) || [];
}
```

2. **addMessageToHistory()** - Thêm tin nhắn
```typescript
async function addMessageToHistory(sessionId, message) {
  const history = chatHistory.get(sessionId) || [];
  history.push(message);
  chatHistory.set(sessionId, history);
}
```

3. **saveConversation()** - Lưu vào MongoDB
```typescript
async function saveConversation(data) {
  await conversationsCollection.insertOne({
    sessionId: data.sessionId,
    question: data.question,
    answer: data.answer,
    timestamp: new Date()
  });
}
```


---

### 4.4. LAYER 4: Utils (Công cụ hỗ trợ)

#### A. ranking.util.ts - Xếp hạng sản phẩm

**File:** `src/utils/ranking.util.ts`

**Chức năng:** Xếp hạng sản phẩm theo thông số kỹ thuật

**Function chính:**

1. **detectProductIntent()** - Phát hiện ý định
```typescript
function detectProductIntent(question) {
  const normalized = normalizeVietnameseText(question);
  
  return {
    wantsPhone: /dien thoai|smartphone|phone/.test(normalized),
    wantsGaming: /choi game|gaming|hieu nang/.test(normalized),
    wantsCamera: /camera|chup anh|chup hinh/.test(normalized),
    budget: detectBudget(question)  // Ví dụ: 15000000
  };
}
```

2. **rankProduct()** - Tính điểm sản phẩm
```typescript
function rankProduct(product, intent) {
  let score = 0;
  
  // Điểm RAM
  const ram = getSpecValue(product.specifications, ["RAM (GB)"]);
  score += ram * 2;  // RAM càng cao càng tốt
  
  // Điểm Camera (nếu user muốn camera)
  if (intent.wantsCamera) {
    const camera = getSpecValue(product.specifications, ["Rear camera (MP)"]);
    score += camera * 1.5;
  }
  
  // Điểm Chipset
  score += calculateChipsetScore(product.specifications);
  
  return { ...product, score };
}
```

3. **pickCandidatesByBudget()** - Lọc theo ngân sách
```typescript
function pickCandidatesByBudget(products, budget, limit) {
  // Ưu tiên sản phẩm trong khoảng 75%-100% ngân sách
  const preferred = products.filter(p => 
    p.price >= budget * 0.75 && p.price <= budget
  );
  
  if (preferred.length >= limit) {
    return preferred.slice(0, limit);
  }
  
  // Nếu không đủ, lấy thêm sản phẩm rẻ hơn
  return products.slice(0, limit);
}
```


---

#### B. chain.util.ts - Tạo LangChain chains

**File:** `src/utils/chain.util.ts`

**Chức năng:** Tạo các chain để giao tiếp với AI

**Function chính:**

1. **createStreamingAnswerChain()** - Tạo câu trả lời
```typescript
function createStreamingAnswerChain(llm) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],  // Hướng dẫn cho AI
    ["human", "{question}"]     // Câu hỏi của user
  ]);
  
  return prompt.pipe(llm);  // Kết nối prompt với AI
}
```

2. **createClassificationChain()** - Phân loại câu hỏi
```typescript
function createClassificationChain(llm) {
  const prompt = `
    Phân loại câu hỏi sau:
    - vector_store: Câu hỏi về sản phẩm/chính sách
    - web_context: Câu hỏi cần tìm trên internet
    - casual_convo: Câu hỏi xã giao
    
    Câu hỏi: {question}
  `;
  
  return prompt.pipe(llm);
}
```

---

#### C. prompt.util.ts - Template prompt

**File:** `src/utils/prompt.util.ts`

**Chức năng:** Chứa các template prompt cho AI

**Ví dụ:**

```typescript
export const SYSTEM_PROMPT = `
Bạn là trợ lý tư vấn sản phẩm của TechStore.

NHIỆM VỤ:
- Tư vấn sản phẩm dựa trên thông tin được cung cấp
- Trả lời chính xác, ngắn gọn
- Luôn đề xuất 1-3 sản phẩm phù hợp

ĐỊNH DẠNG TRẢ LỜI:
{
  "isListFormat": true,
  "products": [
    {
      "product_id": 1,
      "product_name": "iPhone 15 Pro Max",
      "price": 29990000
    }
  ],
  "responseText": "TechStore gợi ý 3 mẫu phù hợp..."
}
`;
```


---

## 5. CÁC KHÁI NIỆM QUAN TRỌNG

### 5.1. RAG là gì?

**RAG = Retrieval-Augmented Generation**

```
Không có RAG:
User: "iPhone 15 Pro Max giá bao nhiêu?"
AI: "Tôi không biết giá hiện tại" ❌

Có RAG:
User: "iPhone 15 Pro Max giá bao nhiêu?"
  ↓
1. Tìm trong database → Tìm thấy: 29.990.000đ
  ↓
2. Đưa thông tin cho AI
  ↓
AI: "iPhone 15 Pro Max có giá 29.990.000đ" ✅
```

**3 bước của RAG:**
1. **Retrieval** (Tìm kiếm): Tìm thông tin liên quan
2. **Augmentation** (Bổ sung): Thêm thông tin vào context
3. **Generation** (Tạo): AI tạo câu trả lời

---

### 5.2. Vector Database (Pinecone) là gì?

**Vector = Mảng số đại diện cho ý nghĩa**

```
Ví dụ:
"điện thoại" → [0.2, 0.8, 0.1, 0.5, ...]  (1536 số)
"smartphone" → [0.21, 0.79, 0.11, 0.49, ...] (gần giống)
"xe máy"     → [0.9, 0.1, 0.7, 0.2, ...]  (khác xa)
```

**Tại sao dùng Vector?**
- Tìm kiếm theo ý nghĩa, không chỉ từ khóa
- "điện thoại" và "smartphone" có ý nghĩa giống nhau
- Tìm được cả khi user viết sai chính tả

**Cách hoạt động:**
```
1. Lưu trữ:
   Document: "iPhone 15 Pro Max có camera 48MP"
   → Chuyển thành vector → Lưu vào Pinecone

2. Tìm kiếm:
   Query: "điện thoại camera đẹp"
   → Chuyển thành vector
   → Tìm vector gần nhất trong Pinecone
   → Trả về document về iPhone
```


---

### 5.3. LangChain là gì?

**LangChain = Framework để xây dựng ứng dụng AI**

**Các thành phần:**

1. **LLM (Large Language Model)**: Model AI (Google Gemini)
2. **Prompt Template**: Mẫu câu hỏi cho AI
3. **Chain**: Chuỗi xử lý (prompt → LLM → output)
4. **Vector Store**: Nơi lưu trữ documents
5. **Retriever**: Công cụ tìm kiếm documents

**Ví dụ:**
```typescript
// Không dùng LangChain (phức tạp)
const response = await fetch('https://api.google.com/gemini', {
  method: 'POST',
  body: JSON.stringify({ prompt: "..." })
});

// Dùng LangChain (đơn giản)
const chain = prompt.pipe(llm);
const response = await chain.invoke({ question: "..." });
```

---

### 5.4. Embedding là gì?

**Embedding = Chuyển text thành vector**

```
Text: "iPhone 15 Pro Max"
  ↓ (Embedding model)
Vector: [0.2, 0.8, 0.1, ..., 0.5]  (1536 số)
```

**Model embedding:** `gemini-embedding-001`

**Tại sao cần?**
- Pinecone chỉ lưu được vector, không lưu text
- Để tìm kiếm, phải chuyển query thành vector

---

### 5.5. Session là gì?

**Session = Phiên chat của 1 user**

```
User A → sessionId: "abc123"
  - Message 1: "Xin chào"
  - Message 2: "Tìm điện thoại"
  - Message 3: "Cái nào rẻ nhất?"

User B → sessionId: "xyz789"
  - Message 1: "Chào bạn"
  - Message 2: "Tìm laptop"
```

**Tại sao cần session?**
- Lưu lịch sử chat
- AI hiểu context (câu hỏi trước đó)
- Phân biệt user khác nhau


---

## 6. VÍ DỤ CỤ THỂ

### Ví dụ 1: "Tìm điện thoại chơi game 15 triệu"

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: User gửi request                                    │
│ POST /api/v1/sessions/user123                              │
│ Body: { "message": "Tìm điện thoại chơi game 15 triệu" }   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Route nhận request                                  │
│ File: src/routes/chat.route.ts                              │
│ router.post('/sessions/:sessionId', streamMessageController)│
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Controller xử lý                                    │
│ File: src/controller/chat.controller.ts                     │
│ streamMessageController()                                   │
│   - sessionId = "user123"                                   │
│   - message = "Tìm điện thoại chơi game 15 triệu"          │
│   - Gọi: processUserQuery(message, sessionId)              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Phân loại câu hỏi                                   │
│ File: src/services/chat.service.ts                          │
│ classifyUserQuery()                                         │
│   - Phát hiện: có từ "điện thoại", "chơi game", "15 triệu" │
│   - Kết quả: queryType = "vector_store"                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: Phát hiện intent                                    │
│ File: src/utils/ranking.util.ts                             │
│ detectProductIntent()                                       │
│   - wantsPhone: true                                        │
│   - wantsGaming: true                                       │
│   - budget: 15000000                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 6: Tìm kiếm trong Pinecone                             │
│ File: src/services/vectorStore.service.ts                   │
│ queryCombinedResult()                                       │
│   - Tìm documents liên quan đến "điện thoại gaming"        │
│   - Kết quả: 5 documents                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 7: Lấy sản phẩm từ TechStore_BE                        │
│ File: src/services/product.service.ts                       │
│ fetchAllProducts()                                          │
│   - GET http://localhost:5000/api/products                 │
│   - Kết quả: 36 sản phẩm                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 8: Xếp hạng sản phẩm                                   │
│ File: src/utils/ranking.util.ts                             │
│ rankProduct()                                               │
│   - Lọc: Chỉ lấy điện thoại                                │
│   - Tính điểm: RAM + CPU + GPU + ...                       │
│   - Sắp xếp: Theo điểm cao → thấp                          │
│   - Kết quả top 3:                                          │
│     1. POCO X6 Pro (14.990.000đ) - Score: 85               │
│     2. Realme GT Neo 5 (13.990.000đ) - Score: 82           │
│     3. Samsung Galaxy A54 (10.990.000đ) - Score: 78        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 9: Tạo câu trả lời                                     │
│ File: src/services/chat.service.ts                          │
│ generateAnswer()                                            │
│   - Gọi Google Gemini AI                                    │
│   - Input: context + products + question                   │
│   - Output: JSON response                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 10: Trả về client                                      │
│ Response:                                                   │
│ {                                                           │
│   "isListFormat": true,                                     │
│   "products": [                                             │
│     {                                                       │
│       "product_id": 15,                                     │
│       "product_name": "POCO X6 Pro",                        │
│       "price": 14990000                                     │
│     },                                                      │
│     ...                                                     │
│   ],                                                        │
│   "responseText": "TechStore gợi ý 3 mẫu điện thoại..."    │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```


---

### Ví dụ 2: "Chính sách bảo hành là gì?"

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1-3: Giống ví dụ 1                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Phân loại câu hỏi                                   │
│ classifyUserQuery()                                         │
│   - Phát hiện: có từ "chính sách bảo hành"                 │
│   - Kết quả: queryType = "vector_store"                    │
│   - intentKind = "policy_faq"                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: Tìm kiếm trong Pinecone                             │
│ queryCombinedResult()                                       │
│   - Tìm documents về "bảo hành"                             │
│   - Kết quả: Tìm thấy file "chinh-sach-bao-hanh.txt"       │
│     từ Dropbox                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 6: Ưu tiên documents                                   │
│ prioritizeDocumentsByIntent()                               │
│   - Vì intentKind = "policy_faq"                            │
│   - Ưu tiên: doc_type = "policy" lên đầu                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 7: Tạo câu trả lời                                     │
│ generateAnswer()                                            │
│   - Gọi Google Gemini AI                                    │
│   - Input: Nội dung file bảo hành + question               │
│   - Output: Câu trả lời về chính sách bảo hành             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 8: Trả về client                                       │
│ Response:                                                   │
│ {                                                           │
│   "isListFormat": false,                                    │
│   "products": [],                                           │
│   "responseText": "TechStore cung cấp chính sách bảo hành  │
│                    12 tháng cho điện thoại, 24 tháng cho    │
│                    laptop..."                               │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```


---

## 7. CÁC FILE QUAN TRỌNG NHẤT

### Top 5 files bạn cần hiểu:

1. **server.ts** ⭐⭐⭐⭐⭐
   - Điểm khởi đầu của toàn bộ hệ thống
   - Khởi động server, kết nối database
   - Đăng ký routes

2. **src/services/chat.service.ts** ⭐⭐⭐⭐⭐
   - Core logic của RAG
   - Function `processUserQuery()` là trái tim của hệ thống
   - Xử lý toàn bộ luồng từ câu hỏi → câu trả lời

3. **src/services/vectorStore.service.ts** ⭐⭐⭐⭐
   - Quản lý Pinecone vector database
   - Tìm kiếm documents liên quan
   - Đồng bộ dữ liệu

4. **src/utils/ranking.util.ts** ⭐⭐⭐⭐
   - Xếp hạng sản phẩm theo specs
   - Phát hiện intent (gaming, camera, budget)
   - Logic tư vấn sản phẩm

5. **src/routes/chat.route.ts** ⭐⭐⭐
   - Định nghĩa API endpoints
   - Điểm tiếp nhận request từ client

---

## 8. CÁCH DEBUG KHI GẶP LỖI

### Bật debug mode

Trong file `.env`:
```
RAG_DEBUG=true
LLM_VERBOSE=true
```

### Đọc logs

```bash
# Chạy server
bun run dev

# Xem logs
[RAG] query:start { sessionId: "abc123", question: "..." }
[RAG] classify:result { queryType: "vector_store" }
[RAG] vector:retrieved { docs: 5 }
[RAG] ranking:intent { wantsGaming: true, budget: 15000000 }
[RAG] answer:done { responseChars: 450 }
```

### Các lỗi thường gặp

1. **ECONNREFUSED** - TechStore_BE chưa chạy
   - Giải pháp: Chạy TechStore_BE trước

2. **MongoDB connection failed** - MongoDB chưa chạy
   - Giải pháp: Cài và chạy MongoDB

3. **Pinecone API error** - API key sai
   - Giải pháp: Kiểm tra PINECONE_API_KEY trong .env

4. **Google AI error** - API key sai
   - Giải pháp: Kiểm tra GOOGLE_API_KEY trong .env


---

## 9. TÓM TẮT LUỒNG HOẠT ĐỘNG

### Luồng đơn giản nhất:

```
1. User gửi câu hỏi
   ↓
2. Route nhận request
   ↓
3. Controller validate
   ↓
4. Service xử lý RAG:
   - Phân loại câu hỏi
   - Tìm kiếm trong Pinecone
   - Lấy sản phẩm từ TechStore_BE
   - Xếp hạng sản phẩm
   - Gọi AI tạo câu trả lời
   ↓
5. Trả response về client
```

### Các thành phần chính:

```
┌─────────────────────────────────────────────────────────┐
│                    M-BOT SYSTEM                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Routes     │→ │ Controllers  │→ │  Services    │ │
│  │ (API định    │  │ (Validate &  │  │ (RAG Logic)  │ │
│  │  nghĩa)      │  │  điều phối)  │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                            ↓            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Utils     │← │   Config     │← │   Models     │ │
│  │ (Ranking,    │  │ (LLM, DB,    │  │ (Data types) │ │
│  │  Prompts)    │  │  Pinecone)   │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Pinecone │        │  Google  │        │ MongoDB  │
   │ (Vector  │        │  Gemini  │        │ (History)│
   │   DB)    │        │   (AI)   │        │          │
   └──────────┘        └──────────┘        └──────────┘
```

---

## 10. CHECKLIST HỌC TẬP

### Để hiểu hệ thống, bạn nên:

- [ ] Đọc file `server.ts` - Hiểu cách server khởi động
- [ ] Đọc `src/routes/chat.route.ts` - Hiểu các API endpoint
- [ ] Đọc `src/controller/chat.controller.ts` - Hiểu cách xử lý request
- [ ] Đọc `src/services/chat.service.ts` - Hiểu core RAG logic
- [ ] Đọc `src/utils/ranking.util.ts` - Hiểu cách xếp hạng sản phẩm
- [ ] Chạy thử và xem logs với `RAG_DEBUG=true`
- [ ] Test với câu hỏi đơn giản: "Xin chào"
- [ ] Test với câu hỏi sản phẩm: "Tìm điện thoại 10 triệu"
- [ ] Test với câu hỏi chính sách: "Chính sách bảo hành?"

### Tài liệu tham khảo thêm:

- `docs/DYNAMIC_FILTERING.md` - Hiểu về dynamic filtering
- `docs/MIGRATION_GUIDE.md` - Hiểu về cấu trúc code
- `docs/QUICK_START.md` - Hướng dẫn chạy nhanh
- `README.md` - Tổng quan toàn bộ dự án

---

## 11. KẾT LUẬN

M-Bot là một hệ thống RAG chatbot với các thành phần:

1. **Routes** - Định nghĩa API
2. **Controllers** - Xử lý request
3. **Services** - Logic nghiệp vụ (RAG core)
4. **Utils** - Công cụ hỗ trợ (ranking, prompts)
5. **Config** - Cấu hình kết nối

**Luồng chính:**
```
Request → Route → Controller → Service (RAG) → Response
```

**Công nghệ:**
- Bun + Express (Server)
- LangChain (RAG framework)
- Google Gemini (AI)
- Pinecone (Vector DB)
- MongoDB (History)

Chúc bạn học tốt! 🚀
