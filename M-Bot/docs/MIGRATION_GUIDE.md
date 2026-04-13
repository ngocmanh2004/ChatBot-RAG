# Migration Guide: Dynamic Filtering & Spec Normalization

## Tổng quan thay đổi

### Trước đây (Hardcoded):
```typescript
// ❌ Hardcoded trong chat.service.ts
const parseSpecNumber = (specs, keys, fallback) => { ... }
const getChipsetTierScore = (specs) => {
  if (/snapdragon\s*8/.test(merged)) score += 25;
  if (/apple\s*a1[67]/.test(merged)) score += 25;
  // ...
}
const detectBudgetFromQuestion = (question) => { ... }
```

### Bây giờ (Config-driven):
```typescript
// ✅ Config trong product.config.ts
export const CHIPSET_TIER_CONFIG = [
  { pattern: /snapdragon\s*8/i, score: 25 },
  { pattern: /apple\s*a1[67]/i, score: 25 },
]

// ✅ Utilities trong spec.util.ts & ranking.util.ts
import { getSpecValue } from "../utils/spec.util";
import { calculateChipsetScore } from "../utils/ranking.util";
```

## Breaking Changes

### 1. ProductCandidate Type thay đổi

**Trước:**
```typescript
type ProductCandidate = {
  product_id: number;
  product_name: string;
  // ... các field khác
  cpu_chip?: string;
  gpu?: string;
  ram_gb?: number;
  storage_gb?: number;
  // ... hardcoded fields
}
```

**Sau:**
```typescript
type ProductCandidate = {
  product_id: number;
  product_name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  specifications?: Record<string, string | number>; // ✅ Dynamic
}
```

### 2. Cách access specifications

**Trước:**
```typescript
const ram = product.ram_gb;
const camera = product.rear_camera_mp;
```

**Sau:**
```typescript
import { getSpecValue } from "../utils/spec.util";

const ram = getSpecValue(product.specifications, ["RAM (GB)", "ram_gb"]);
const camera = getSpecValue(product.specifications, ["Rear camera (MP)", "rear_camera_mp"]);
```

### 3. Functions đã bị remove/rename

| Old Function | New Function | Location |
|-------------|--------------|----------|
| `parseSpecNumber(specs, keys, fallback)` | `getSpecValue(specs, keys, fallback)` | `utils/spec.util.ts` |
| `getChipsetTierScore(specs)` | `calculateChipsetScore(specs)` | `utils/ranking.util.ts` |
| `detectBudgetFromQuestion(question)` | `detectBudget(question)` | `utils/ranking.util.ts` |
| `rankProductByIntent(item, intent)` | `rankProduct(item, intent)` | `utils/ranking.util.ts` |

## Migration Steps

### Step 1: Update imports

```typescript
// ❌ Old
// No imports needed (functions were in same file)

// ✅ New
import { getSpecValue } from "../utils/spec.util";
import { 
  detectProductIntent, 
  rankProduct, 
  pickCandidatesByBudget,
  calculateChipsetScore 
} from "../utils/ranking.util";
```

### Step 2: Update product access patterns

```typescript
// ❌ Old
const buildProductHighlights = (product: ProductCandidate) => {
  const parts: string[] = [];
  if (product.rear_camera_mp) parts.push(`rear ${product.rear_camera_mp}MP`);
  if (product.ram_gb) parts.push(`RAM ${product.ram_gb}GB`);
  return parts.join(", ");
};

// ✅ New
const buildProductHighlights = (product: ProductCandidate) => {
  const specs = product.specifications || {};
  const parts: string[] = [];
  
  const rearCamera = getSpecValue(specs, ["Rear camera (MP)", "rear_camera_mp"]);
  const ram = getSpecValue(specs, ["RAM (GB)", "ram_gb"]);
  
  if (rearCamera) parts.push(`rear ${rearCamera}MP`);
  if (ram) parts.push(`RAM ${ram}GB`);
  return parts.join(", ");
};
```

### Step 3: Update ranking logic

```typescript
// ❌ Old
const rankedCandidates = products.map((item) => rankProductByIntent(item, intent));

// ✅ New
const rankedCandidates = products.map((item) => rankProduct(item, intent));
```

### Step 4: Update logging

```typescript
// ❌ Old
const summarizeCandidateForLog = (item) => ({
  id: item.product_id,
  cpu: item.cpu_chip || null,
  ram_gb: item.ram_gb || null,
});

// ✅ New
const summarizeCandidateForLog = (item) => ({
  id: item.product_id,
  cpu: item.specifications?.["CPU"] || null,
  ram_gb: getSpecValue(item.specifications || {}, ["RAM (GB)", "ram_gb"]) || null,
});
```

## Customization Guide

### Thêm field mới

1. **Thêm vào schema:**
```typescript
// src/config/product.config.ts
export const PRODUCT_SPEC_SCHEMA = {
  // ... existing
  weight_g: {
    key: "weight_g",
    label: "Weight (g)",
    type: "number",
    unit: "g",
    aliases: ["Weight", "weight", "Khoi luong"],
  }
}
```

2. **Sử dụng:**
```typescript
const weight = getSpecValue(specs, ["Weight (g)", "weight_g"]);
```

### Thêm chipset pattern mới

```typescript
// src/config/product.config.ts
export const CHIPSET_TIER_CONFIG = [
  // ... existing
  { pattern: /tensor\s*g[34]/i, score: 20, description: "Google Tensor G3/G4" },
]
```

### Thêm intent pattern mới

```typescript
// src/config/product.config.ts
export const INTENT_PATTERNS = {
  // ... existing
  battery: {
    keywords: ["pin", "battery", "pin khoe", "su dung lau"],
    weight: 1.0,
  }
}
```

### Thêm ranking profile mới

```typescript
// src/config/product.config.ts
export const RANKING_WEIGHTS = {
  // ... existing
  battery: {
    ram: 2,
    storage: 0.03,
    refreshRate: 0.1,
    battery: 0.005,      // High weight
    fastCharge: 0.3,     // High weight
    chipsetTier: 0.3,
    rearCamera: 0.5,
    frontCamera: 0.3,
    screenSize: 1.5,
  }
}
```

## Testing

### Run unit tests

```bash
cd M-Bot
bun test src/utils/__tests__/spec.util.test.ts
bun test src/utils/__tests__/ranking.util.test.ts
```

### Manual testing

```bash
# Start server
bun run server.ts

# Test query
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tìm điện thoại chơi game 15 triệu",
    "sessionId": "test-123"
  }'
```

## Rollback Plan

Nếu cần rollback:

1. Revert commits:
```bash
git revert <commit-hash>
```

2. Hoặc restore old files:
```bash
git checkout <old-commit> -- src/services/chat.service.ts
git checkout <old-commit> -- src/services/product.service.ts
```

## Support

Nếu gặp vấn đề:
1. Check logs: `tail -f tmp-chat-err.log`
2. Enable debug: `RAG_DEBUG=true` trong `.env`
3. Run tests: `bun test`
4. Contact team lead

## Checklist

- [ ] Đọc DYNAMIC_FILTERING.md
- [ ] Update imports trong code của bạn
- [ ] Thay đổi cách access product specs
- [ ] Run tests
- [ ] Test manually với queries thực tế
- [ ] Update documentation nếu cần
