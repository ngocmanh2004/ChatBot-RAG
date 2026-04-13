# Quick Start Guide - Dynamic Filtering

## Tổng quan

Hệ thống đã được refactor để loại bỏ hardcode và sử dụng config-driven approach. Tất cả configuration nằm trong `src/config/product.config.ts`.

## 1. Thêm thuộc tính mới

### Ví dụ: Thêm trường "Trọng lượng"

```typescript
// src/config/product.config.ts
export const PRODUCT_SPEC_SCHEMA = {
  // ... existing fields
  
  weight_g: {
    key: "weight_g",
    label: "Weight (g)",
    type: "number",
    unit: "g",
    aliases: ["Weight", "weight", "Khoi luong", "Trong luong"],
  }
}
```

### Sử dụng trong code

```typescript
import { getSpecValue } from "../utils/spec.util";

const weight = getSpecValue(product.specifications, ["Weight (g)", "weight_g"]);
console.log(`Weight: ${weight}g`);
```

## 2. Thêm pattern chipset mới

### Ví dụ: Thêm Google Tensor

```typescript
// src/config/product.config.ts
export const CHIPSET_TIER_CONFIG = [
  // ... existing patterns
  { 
    pattern: /tensor\s*g[34]/i, 
    score: 20, 
    description: "Google Tensor G3/G4" 
  },
]
```

## 3. Thêm intent mới

### Ví dụ: Thêm intent "pin khỏe"

```typescript
// src/config/product.config.ts
export const INTENT_PATTERNS = {
  // ... existing intents
  
  battery: {
    keywords: ["pin", "battery", "pin khoe", "su dung lau", "tiet kiem pin"],
    weight: 1.0,
  }
}
```

### Thêm ranking profile cho intent mới

```typescript
// src/config/product.config.ts
export const RANKING_WEIGHTS = {
  // ... existing profiles
  
  battery: {
    ram: 2,
    storage: 0.03,
    refreshRate: 0.1,
    battery: 0.005,      // ⬆️ High weight
    fastCharge: 0.3,     // ⬆️ High weight
    chipsetTier: 0.3,    // ⬇️ Lower (efficiency matters)
    rearCamera: 0.5,
    frontCamera: 0.3,
    screenSize: 1.5,
  }
}
```

### Update ranking logic

```typescript
// src/utils/ranking.util.ts
export const calculateProductScore = (
  product: ProductCandidate,
  intent: ProductIntent
): number => {
  // ... existing code
  
  // Select weights based on intent
  let weights: RankingWeights;
  if (intent.wantsGaming && !intent.wantsCamera) {
    weights = RANKING_WEIGHTS.gaming;
  } else if (intent.wantsCamera && !intent.wantsGaming) {
    weights = RANKING_WEIGHTS.camera;
  } else if (intent.wantsBattery) {  // ✅ Add this
    weights = RANKING_WEIGHTS.battery;
  } else {
    weights = RANKING_WEIGHTS.balanced;
  }
  
  // ... rest of code
}
```

## 4. Customize ranking weights

### Ví dụ: Tăng trọng số camera

```typescript
// src/config/product.config.ts
export const RANKING_WEIGHTS = {
  camera: {
    ram: 2,
    storage: 0.03,
    refreshRate: 0.1,
    battery: 0.001,
    fastCharge: 0.08,
    chipsetTier: 0.5,
    rearCamera: 5,       // ⬆️ Tăng từ 3 lên 5
    frontCamera: 3,      // ⬆️ Tăng từ 2 lên 3
    screenSize: 2.5,
  }
}
```

## 5. Thêm budget pattern mới

### Ví dụ: Hỗ trợ "tỷ"

```typescript
// src/config/product.config.ts
export const BUDGET_PATTERNS = [
  // ... existing patterns
  { 
    pattern: /(\d+(?:[.,]\d+)?)\s*(ty|billion)\b/i, 
    multiplier: 1_000_000_000, 
    description: "Billion VND" 
  },
]
```

## 6. Testing

### Unit tests

```bash
# Test spec utilities
bun test src/utils/__tests__/spec.util.test.ts

# Test ranking utilities
bun test src/utils/__tests__/ranking.util.test.ts

# Test all
bun test
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

### Enable debug logging

```bash
# .env
RAG_DEBUG=true
```

## 7. Common Tasks

### Task: Thêm field "Waterproof rating"

1. **Add to schema:**
```typescript
waterproof_rating: {
  key: "waterproof_rating",
  label: "Waterproof rating",
  type: "string",
  aliases: ["IP rating", "Water resistance", "Chong nuoc"],
}
```

2. **Use in code:**
```typescript
const ipRating = getSpecValue(specs, ["Waterproof rating", "waterproof_rating"], "N/A");
```

### Task: Thêm category "Smartwatch"

```typescript
// src/config/product.config.ts
export const CATEGORY_PATTERNS = {
  // ... existing
  smartwatch: /dong ho thong minh|smartwatch|watch/i,
}
```

### Task: Adjust budget bands

```typescript
// src/config/product.config.ts
export const BUDGET_BANDS = [
  { min: 0.8, max: 1.0, priority: 1, label: "band_80_100" },   // 80-100%
  { min: 0.6, max: 0.8, priority: 2, label: "band_60_80" },    // 60-80%
  { min: 0.4, max: 0.6, priority: 3, label: "band_40_60" },    // 40-60%
  { min: 0, max: 0.4, priority: 4, label: "band_below_40" },   // <40%
]
```

## 8. Troubleshooting

### Issue: Spec không được normalize

**Check:**
1. Field có trong `PRODUCT_SPEC_SCHEMA`?
2. Alias có đúng không?
3. Type có đúng không (number vs string)?

**Debug:**
```typescript
import { findSpecFieldKey } from "../utils/spec.util";
console.log(findSpecFieldKey("RAM")); // Should return "ram_gb"
```

### Issue: Intent không được detect

**Check:**
1. Keywords có trong `INTENT_PATTERNS`?
2. Text có được normalize đúng không?

**Debug:**
```typescript
import { detectProductIntent } from "../utils/ranking.util";
const intent = detectProductIntent("Tìm điện thoại chơi game");
console.log(intent); // Should have wantsGaming: true
```

### Issue: Ranking không đúng

**Check:**
1. Weights có hợp lý không?
2. Specs có đầy đủ không?

**Debug:**
```typescript
import { calculateProductScore } from "../utils/ranking.util";
const score = calculateProductScore(product, intent);
console.log(score);
```

## 9. Best Practices

✅ **DO:**
- Use `getSpecValue()` để access specs
- Add aliases cho các tên gọi khác nhau
- Test với real queries
- Document changes trong CHANGELOG.md

❌ **DON'T:**
- Hardcode patterns trong service files
- Access specs trực tiếp: `product.ram_gb` ❌
- Skip validation
- Forget to update tests

## 10. Resources

- [DYNAMIC_FILTERING.md](./DYNAMIC_FILTERING.md) - Full documentation
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration guide
- [config.example.ts](../config.example.ts) - Configuration examples
- [CHANGELOG.md](../CHANGELOG.md) - Version history
