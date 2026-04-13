# Changelog

## [2.0.0] - 2026-03-28

### 🎉 Major Refactor: Dynamic Filtering & Specification Normalization

#### Added
- **Configuration System** (`src/config/product.config.ts`)
  - Centralized product specification schema
  - Configurable chipset tier scoring patterns
  - Intent detection patterns (gaming, camera, phone, etc.)
  - Budget detection patterns (triệu, k, raw numbers)
  - Ranking weight profiles (balanced, gaming, camera)
  - Budget band configuration
  - Category detection patterns

- **Specification Utilities** (`src/utils/spec.util.ts`)
  - `parseSpecNumber()` - Parse numbers from various formats
  - `findSpecFieldKey()` - Find standardized field keys from aliases
  - `normalizeSpecValue()` - Normalize values based on field type
  - `normalizeSpecifications()` - Normalize entire spec objects
  - `extractSpecsFromRawProduct()` - Extract specs from raw product data
  - `getSpecValue()` - Get spec values with fallback support
  - `validateSpecifications()` - Validate specs against schema

- **Ranking Utilities** (`src/utils/ranking.util.ts`)
  - `normalizeVietnameseText()` - Normalize Vietnamese text for matching
  - `calculateChipsetScore()` - Calculate chipset tier score
  - `detectBudget()` - Detect budget from question text
  - `detectCategory()` - Detect product category
  - `isPhoneCategory()` - Check if category is phone
  - `detectProductIntent()` - Detect user intent from question
  - `calculateProductScore()` - Calculate product score based on intent
  - `rankProduct()` - Rank product with score
  - `pickCandidatesByBudget()` - Pick candidates by budget bands

- **Documentation**
  - `docs/DYNAMIC_FILTERING.md` - Feature documentation
  - `docs/MIGRATION_GUIDE.md` - Migration guide for team
  - `config.example.ts` - Configuration examples

- **Tests**
  - `src/utils/__tests__/spec.util.test.ts` - Spec utility tests
  - `src/utils/__tests__/ranking.util.test.ts` - Ranking utility tests

#### Changed
- **Breaking**: `ProductCandidate` type now uses `specifications?: Record<string, string | number>` instead of individual fields
- **Refactored** `src/services/product.service.ts`
  - Removed `toSpecificationsFromRaw()` function
  - Now uses `extractSpecsFromRawProduct()` and `normalizeSpecifications()`
  - Cleaner normalization logic
  
- **Refactored** `src/services/chat.service.ts`
  - Removed 200+ lines of hardcoded logic
  - Removed functions: `parseSpecNumber()`, `getChipsetTierScore()`, `detectBudgetFromQuestion()`, `rankProductByIntent()`, `pickCandidatesByBudget()`
  - Now imports utilities from `spec.util.ts` and `ranking.util.ts`
  - Uses config-driven approach for all filtering and ranking

#### Removed
- Hardcoded chipset patterns in `chat.service.ts`
- Hardcoded intent detection logic
- Hardcoded budget parsing logic
- Hardcoded ranking weights
- Individual product spec fields in `ProductCandidate` type

#### Benefits
- ✅ No more hardcode - all config in one place
- ✅ Easy to extend - add new fields/patterns by editing config
- ✅ Type safe - TypeScript validation
- ✅ Maintainable - clear separation of concerns
- ✅ Testable - pure functions, easy to unit test
- ✅ Flexible - support multiple input formats
- ✅ Consistent - normalize data from different sources

#### Migration
See `docs/MIGRATION_GUIDE.md` for detailed migration instructions.

#### Testing
```bash
# Run unit tests
bun test src/utils/__tests__/spec.util.test.ts
bun test src/utils/__tests__/ranking.util.test.ts

# Manual testing
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Tìm điện thoại chơi game 15 triệu", "sessionId": "test"}'
```

---

## [1.0.0] - 2026-03-20

### Initial Release
- RAG pipeline with Pinecone vector store
- Integration with .NET backend API
- Product recommendation system
- Tavily and Google search integration
- Conversation history management
- JSON response format with product lists
