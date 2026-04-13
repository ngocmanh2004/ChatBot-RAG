# FlexBot BE

LangChain-based chatbot backend for TechStore (products + policies + FAQ + web context).

## Run

```bash
bun install
bun run start
```

## Required `.env` values

- `PORT`
- `GOOGLE_API_KEY`
- `LLM_MODEL_NAME`
- `LLM_EMBEDDING_MODEL_NAME`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `MONGODB_COLLECTION_NAME`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `MAIN_BACKEND_API`

## Optional `.env` values

- `TAVILY_API_KEY`
- `TAVILY_DISABLED=false`
- `GOOGLE_CSE_ID` (required if using Google Custom Search)
- `GOOGLE_SEARCH_DISABLED=false`
- `MAIN_BACKEND_FAQ_ENDPOINT` (e.g. `https://your-dotnet-api/api/faqs`)
- `MAIN_BACKEND_POLICY_ENDPOINT` (e.g. `https://your-dotnet-api/api/policies`)
- `AUTO_SYNC_ON_START=true|false` (default `true`)
- `LLM_VERBOSE=true|false` (default `false`)
- `LLM_CLASSIFICATION_DISABLED=true|false` (default `true`)
- `LLM_REWRITE_DISABLED=true|false` (default `true`)
- `MAX_CONTEXT_DOCS` (default `4`)
- `MAX_CONTEXT_CHARS` (default `3500`)
- `SELF_QUERY_DISABLED=true|false` (default `false`)
- `SELF_QUERY_TOP_K` (default `3`)
- `SIMILARITY_TOP_K` (default `3`)

## Implemented integration services

- Mongo conversation persistence:
  - `saveConversation(conversation)`
  - `getConversationById(conversationId)`
- Pinecone retrieval with interaction logging.
- Tavily product/web search:
  - `searchProductFromTavily(query)`
- Main backend product API:
  - `fetchProductDetails(productId)`
- Google Custom Search:
  - `searchFromGoogle(query)`

All external API calls are logged into MongoDB with `doc_type = "api_interaction"` and linked to conversation records when available.

## Debug endpoints

- `GET /api/v1/products/preview`
  - Check whether chatbot backend can fetch product data from `.NET` API.
- `GET /api/v1/products/vector-preview?q=<your query>`
  - Check vector retrieval results for a specific query.
