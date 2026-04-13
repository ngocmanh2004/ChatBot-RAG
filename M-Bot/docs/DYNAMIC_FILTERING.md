# Dynamic Product Filtering & Specification Normalization

## Overview

Hệ thống đã được refactor để loại bỏ hardcode và sử dụng configuration-driven approach cho việc filter và ranking sản phẩm.

## 1. Chuẩn hóa thuộc tính kỹ thuật (Specification Normalization)

### Schema chuẩn (`src/config/product.config.ts`)

Tất cả thuộc tính kỹ thuật được định nghĩa trong `PRODUCT_SPEC_SCHEMA`:

```typescript
{
  cpu_chip: { key: "cpu_chip", label: "CPU", type: "string", aliases: ["CPU", "Processor"] },
  ram_gb: { key: "ram_gb", label: "RAM (GB)", type: "number", unit: "GB", aliases: ["RAM"] },
  // ... các field khác
}
```

### Tính năng:

- **Type safety**: Mỗi field có type rõ ràng (number, string, enum)
- **Aliases**: Hỗ trợ nhiều tên gọi khác nhau cho cùng 1 field
- **Unit tracking**: Lưu đơn vị đo lường (GB, MP, Hz, mAh, W)
- **Auto-normalization**: Tự động chuẩn hóa từ raw data

### Utilities (`src/utils/spec.util.ts`)

```typescript
// Parse số từ nhiều format
parseSpecNumber("8GB") // → 8
parseSpecNumber("8,5") // → 8.5

// Tìm field key từ alias
findSpecFieldKey("RAM") // → "ram_gb"
findSpecFieldKey("Memory") // → "ram_gb"

// Normalize toàn bộ specs
normalizeSpecifications({
  "RAM": "8GB",
  "cpu": "Snapdragon 8 Gen 2"
})
// → { "RAM (GB)": 8, "CPU": "Snapdragon 8 Gen 2" }

// Extract specs từ raw product
extractSpecsFromRawProduct(rawProduct)

// Get spec value với fallback
getSpecValue(specs, ["RAM (GB)", "ram_gb"], 0)

// Validate specs
validateSpecifications(specs)
// → { valid: true, errors: [] }
```

## 2. Dynamic Filtering & Ranking

### Intent Detection (`src/utils/ranking.util.ts`)

Hệ thống tự động detect ý định người dùng từ câu hỏi:

```typescript
detectProductIntent("Tìm điện thoại chơi game 15 triệu")
// → {
//   wantsPhone: true,
//   wantsGaming: true,
//   wantsCamera: false,
//   budget: 15000000,
//   category: "phone"
// }
```

### Configurable Patterns

**Intent patterns** (`INTENT_PATTERNS`):
```typescript
{
  gaming: {
    keywords: ["hieu nang", "choi game", "gaming", "chip manh", "fps", "ram"],
    weight: 1.0
  },
  camera: {
    keywords: ["camera", "chup hinh", "chup anh", "quay video"],
    weight: 1.0
  }
}
```

**Budget patterns** (`BUDGET_PATTERNS`):
```typescript
[
  { pattern: /(\d+)\s*(trieu|tr)/i, multiplier: 1_000_000 },
  { pattern: /(\d+)\s*(k|nghin)/i, multiplier: 1_000 }
]
```

**Chipset scoring** (`CHIPSET_TIER_CONFIG`):
```typescript
[
  { pattern: /snapdragon\s*8/i, score: 25, description: "Snapdragon 8 series" },
  { pattern: /apple\s*a1[678]/i, score: 25, description: "Apple A16-A18" }
]
```

### Ranking Weights

3 profile ranking khác nhau:

```typescript
RANKING_WEIGHTS = {
  balanced: { ram: 4, rearCamera: 1.8, chipsetTier: 1, ... },
  gaming: { ram: 6, refreshRate: 0.5, chipsetTier: 2, ... },
  camera: { rearCamera: 3, frontCamera: 2, screenSize: 2.5, ... }
}
```

### Budget Bands

Tự động chọn sản phẩm theo band giá:

```typescript
BUDGET_BANDS = [
  { min: 0.75, max: 1.0, priority: 1, label: "band_75_100" },   // 75-100% budget
  { min: 0.5, max: 0.75, priority: 2, label: "band_50_75" },    // 50-75% budget
  { min: 0, max: 0.5, priority: 3, label: "band_below_50" }     // <50% budget
]
```

## 3. API Usage

### Trong chat.service.ts

```typescript
import { 
  detectProductIntent, 
  rankProduct, 
  pickCandidatesByBudget 
} from "../utils/ranking.util";
import { getSpecValue } from "../utils/spec.util";

// Detect intent
const intent = detectProductIntent(question);

// Rank products
const rankedProducts = products.map(p => rankProduct(p, intent));

// Pick by budget
const result = pickCandidatesByBudget(rankedProducts, intent.budget, 3);

// Get spec values
const ram = getSpecValue(product.specifications, ["RAM (GB)", "ram_gb"]);
```

## 4. Cách thêm field mới

### Bước 1: Thêm vào schema

```typescript
// src/config/product.config.ts
export const PRODUCT_SPEC_SCHEMA = {
  // ... existing fields
  
  weight_g: {
    key: "weight_g",
    label: "Weight (g)",
    type: "number",
    unit: "g",
    aliases: ["Weight", "weight", "Khoi luong"],
  }
}
```

### Bước 2: Thêm vào ranking weights (nếu cần)

```typescript
export const RANKING_WEIGHTS = {
  balanced: {
    // ... existing weights
    weight: 0.01, // lighter is better
  }
}
```

### Bước 3: Update ranking logic (nếu cần)

```typescript
// src/utils/ranking.util.ts
export const calculateProductScore = (product, intent) => {
  const weight = getSpecValue(specs, ["Weight (g)", "weight_g"]);
  
  const score = 
    ram * weights.ram +
    // ... other factors
    (weight > 0 ? (300 - weight) * weights.weight : 0); // lighter = higher score
    
  return score;
}
```

## 5. Cách thêm intent pattern mới

```typescript
// src/config/product.config.ts
export const INTENT_PATTERNS = {
  // ... existing patterns
  
  battery: {
    keywords: ["pin", "battery", "pin khoe", "su dung lau"],
    weight: 1.0
  }
}
```

Sau đó update ranking weights:

```typescript
export const RANKING_WEIGHTS = {
  // ... existing profiles
  
  battery: {
    ram: 2,
    battery: 0.005,      // High weight for battery
    fastCharge: 0.3,     // High weight for fast charge
    chipsetTier: 0.3,    // Lower weight (efficiency matters)
    rearCamera: 0.5,
    // ...
  }
}
```

## 6. Testing

```bash
# Run tests
bun test

# Check specific query
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Tìm điện thoại chơi game 15 triệu", "sessionId": "test"}'
```

## 7. Benefits

✅ **No more hardcode**: Tất cả config ở 1 nơi  
✅ **Easy to extend**: Thêm field/pattern mới chỉ cần edit config  
✅ **Type safe**: TypeScript validation  
✅ **Maintainable**: Clear separation of concerns  
✅ **Testable**: Pure functions, easy to unit test  
✅ **Flexible**: Support nhiều format input khác nhau  
✅ **Consistent**: Chuẩn hóa data từ nhiều nguồn khác nhau
