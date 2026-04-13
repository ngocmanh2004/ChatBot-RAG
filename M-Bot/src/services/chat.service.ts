import initLLM from "../config/llm.config";
import {
  createClassificationChain,
  createRewriteQueryChain,
  createDocumentEvaluatorChain,
  createStreamingAnswerChain,
} from "../utils/chain.util";
import type { Document } from "langchain/document";

import {
  getChatHistory,
  addMessageToHistory,
  saveConversation,
} from "./conversations.service";

import { queryCombinedResult } from "./vectorStore.service";
import type Message from "../models/message.model";
import { searchProductFromTavily } from "./tavily.service";
import { searchFromGoogle } from "./google.service";
import {
  fetchAllProducts,
  fetchProductDetails,
  formatProductDetailForContext,
} from "./product.service";
import {
  normalizeVietnameseText,
  detectProductIntent,
  rankProduct,
  pickCandidatesByBudget,
  isPhoneCategory,
  type ProductCandidate,
  type RankedCandidate,
} from "../utils/ranking.util";
import { getSpecValue } from "../utils/spec.util";

const DOCUMENT_EVALUATION_DISABLED = true;
const LLM_CLASSIFICATION_DISABLED =
  (Bun.env.LLM_CLASSIFICATION_DISABLED || "true") === "true";
const LLM_REWRITE_DISABLED =
  (Bun.env.LLM_REWRITE_DISABLED || "true") === "true";
const MAX_CONTEXT_DOCS = Number(Bun.env.MAX_CONTEXT_DOCS || "4");
const MAX_CONTEXT_CHARS = Number(Bun.env.MAX_CONTEXT_CHARS || "3500");
const RAG_DEBUG = (Bun.env.RAG_DEBUG || "false") === "true";

const ragLog = (step: string, payload?: unknown) => {
  if (!RAG_DEBUG) return;

  if (payload === undefined) {
    console.log(`[RAG] ${step}`);
    return;
  }

  console.log(`[RAG] ${step}`, payload);
};

const serializeContent = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  try {
    return JSON.stringify(content);
  } catch (_err) {
    return String(content);
  }
};

const safeQueryCombinedResult = async (
  query: string,
  sessionId: string,
  conversationId: string
) => {
  try {
    return await queryCombinedResult(query, sessionId, conversationId);
  } catch (err) {
    console.error("[RAG] Vector retrieval failed:", err);
    return [] as Document[];
  }
};

const formatChatHistory = async (history: Message[]) => {
  if (history.length === 0) {
    return "";
  }

  return history
    .map((msg: Message) => `${msg.role}: ${serializeContent(msg.content)}`)
    .join("\n");
};

const isCasualConversationQuestion = (question: string) => {
  const normalized = normalizeVietnameseText(question).trim();
  if (!normalized) return true;

  const greetingRegex =
    /^(xin chao|chao ban|chao|hello|hi|hey|cam on|thank you|thanks|bye|tam biet)([!.?,\s]|$)/i;
  const casualOnlyRegex =
    /^(xin chao|chao|hello|hi|hey|cam on|thank you|thanks|bye|tam biet)[!.?,\s]*$/i;

  return greetingRegex.test(normalized) && casualOnlyRegex.test(normalized);
};

type QueryIntentKind = "product" | "policy_faq" | "general";

const POLICY_OR_FAQ_PATTERNS: RegExp[] = [
  /chinh sach/i,
  /bao mat/i,
  /quyen rieng tu/i,
  /privacy/i,
  /dieu khoan/i,
  /doi tra/i,
  /hoan tien/i,
  /van chuyen/i,
  /giao hang/i,
  /bao hanh/i,
  /thanh toan/i,
  /faq/i,
  /cau hoi thuong gap/i,
];

const PRODUCT_QUERY_PATTERNS: RegExp[] = [
  /san pham/i,
  /dien thoai/i,
  /smartphone/i,
  /laptop/i,
  /tablet/i,
  /tai nghe/i,
  /phu kien/i,
  /gia\b/i,
  /gia tien/i,
  /mua\b/i,
  /tu van/i,
  /goi y/i,
  /so sanh/i,
  /model/i,
  /cau hinh/i,
];

const classifyUserQuery = async (question: string, sessionId: string) => {
  ragLog("classify:start", { sessionId, question });

  if (LLM_CLASSIFICATION_DISABLED) {
    if (isCasualConversationQuestion(question)) {
      ragLog("classify:result", { queryType: "casual_convo", source: "rule" });
      return "casual_convo";
    }

    const intentKind = detectQueryIntentKind(question);
    if (intentKind === "general") {
      ragLog("classify:result", {
        queryType: "web_context",
        source: "rule",
        intentKind,
      });
      return "web_context";
    }

    ragLog("classify:result", { queryType: "vector_store", source: "rule" });
    return "vector_store";
  }

  try {
    const llm = initLLM();
    const classificationChain = createClassificationChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await classificationChain.invoke({
      history: historyText,
      question,
    });

    if (result.includes("vector_store")) {
      ragLog("classify:result", { queryType: "vector_store", source: "llm" });
      return "vector_store";
    }
    if (result.includes("web_context")) {
      ragLog("classify:result", { queryType: "web_context", source: "llm" });
      return "web_context";
    }
    ragLog("classify:result", { queryType: "casual_convo", source: "llm" });
    return "casual_convo";
  } catch (err) {
    throw err;
  }
};

const rewriteQuery = async (
  question: string,
  sessionId: string,
  mode: string,
  documentInfo?: string
) => {
  ragLog("rewrite:start", { mode, question });
  if (LLM_REWRITE_DISABLED) {
    ragLog("rewrite:skip", { reason: "LLM_REWRITE_DISABLED" });
    return question;
  }

  try {
    const llm = initLLM();
    const rewriteChain = createRewriteQueryChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await rewriteChain.invoke({
      history: historyText,
      question,
      mode,
      documentInfo: documentInfo || "",
    });

    const rewritten = result || question;
    ragLog("rewrite:result", { mode, rewritten });
    return rewritten;
  } catch (err) {
    throw err;
  }
};

const evaluateDocuments = async (question: string, documents: Document[]) => {
  try {
    const llm = initLLM();
    const evaluatorChain = createDocumentEvaluatorChain(llm);

    const evaluationPromises = documents.map(async (doc) => {
      const result = await evaluatorChain.invoke({
        question,
        document: doc.pageContent,
      });
      return { doc, result };
    });

    const results = await Promise.allSettled(evaluationPromises);
    const relevantDocs: Document[] = [];
    let hasDirectAnswer = false;

    results.forEach((promiseResult) => {
      if (promiseResult.status !== "fulfilled") {
        return;
      }

      const { doc, result } = promiseResult.value;

      if (result?.includes("direct_answer")) {
        hasDirectAnswer = true;
      }

      if (result?.includes("relevant") || result?.includes("direct_answer")) {
        relevantDocs.push(doc);
      }
    });

    const needsWebSearch = !hasDirectAnswer;
    return { relevantDocs, needsWebSearch };
  } catch (err) {
    throw err;
  }
};

const extractProductIdFromQuestion = (question: string) => {
  const patterns = [
    /\bproduct\s*id\s*[:#]?\s*(\d+)\b/i,
    /\bid\s*[:#]?\s*(\d+)\b/i,
    /\bma\s*san\s*pham\s*[:#]?\s*(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

const detectQueryIntentKind = (question: string): QueryIntentKind => {
  const normalized = normalizeVietnameseText(question);
  const productIntent = detectProductIntent(question);
  const hasPolicyOrFaqIntent = POLICY_OR_FAQ_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );

  if (hasPolicyOrFaqIntent) {
    return "policy_faq";
  }

  const hasProductIntent =
    productIntent.wantsPhone ||
    productIntent.wantsGaming ||
    productIntent.wantsCamera ||
    Boolean(productIntent.budget) ||
    Boolean(extractProductIdFromQuestion(question)) ||
    PRODUCT_QUERY_PATTERNS.some((pattern) => pattern.test(normalized));

  if (hasProductIntent) {
    return "product";
  }

  return "general";
};

const prioritizeDocumentsByIntent = (
  documents: Document[],
  intentKind: QueryIntentKind
) => {
  if (intentKind !== "policy_faq") {
    return documents;
  }

  const getPriority = (doc: Document) => {
    const docType = String((doc.metadata || {}).doc_type || "");
    if (docType === "policy") return 0;
    if (docType === "faq") return 1;
    return 2;
  };

  return documents
    .map((doc, index) => ({ doc, index }))
    .sort(
      (a, b) => getPriority(a.doc) - getPriority(b.doc) || a.index - b.index
    )
    .map((item) => item.doc);
};

const buildExternalWebContext = async (
  query: string,
  sessionId: string,
  conversationId: string
) => {
  const [tavilyResult, googleResult] = await Promise.all([
    searchProductFromTavily(query, sessionId, conversationId),
    searchFromGoogle(query, sessionId, conversationId),
  ]);

  const contextParts: string[] = [];

  if (tavilyResult?.pageContent) {
    contextParts.push(`Tavily context:\n${tavilyResult.pageContent}`);
  }

  if (googleResult?.pageContent) {
    contextParts.push(`Google context:\n${googleResult.pageContent}`);
  }

  return contextParts.join("\n\n---\n\n");
};

const buildBoundedContext = (documents: Document[]) => {
  if (documents.length === 0) {
    return "";
  }

  const boundedDocs = documents.slice(0, MAX_CONTEXT_DOCS);
  const rawContext = boundedDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");

  if (rawContext.length <= MAX_CONTEXT_CHARS) {
    return rawContext;
  }

  return rawContext.slice(0, MAX_CONTEXT_CHARS);
};

const summarizeCandidateForLog = (item: RankedCandidate | ProductCandidate) => ({
  id: item.product_id,
  name: item.product_name,
  price: item.price,
  stock: item.stock,
  ...(typeof (item as RankedCandidate).score === "number"
    ? { score: Number((item as RankedCandidate).score.toFixed(2)) }
    : {}),
  cpu: item.specifications?.["CPU"] || null,
  ram_gb: getSpecValue(item.specifications || {}, ["RAM (GB)", "ram_gb"]) || null,
  rear_camera_mp: getSpecValue(item.specifications || {}, ["Rear camera (MP)", "rear_camera_mp"]) || null,
  refresh_rate_hz: getSpecValue(item.specifications || {}, ["Refresh rate (Hz)", "refresh_rate_hz"]) || null,
});

const buildProductCandidatesFromBackend = async (
  question: string
): Promise<ProductCandidate[]> => {
  try {
    const products = await fetchAllProducts();
    if (products.length === 0) {
      return [];
    }

    const intent = detectProductIntent(question);
    ragLog("ranking:intent", intent);

    const inStockProducts = products.filter((item) => item.stock > 0);
    const categoryMatched = inStockProducts.filter((item) =>
      intent.wantsPhone ? isPhoneCategory(item.category) : true
    );
    ragLog("ranking:pool", {
      totalProducts: products.length,
      inStock: inStockProducts.length,
      categoryMatched: categoryMatched.length,
    });

    const rankedCandidates = products
      .filter((item) => item.stock > 0)
      .filter((item) => (intent.wantsPhone ? isPhoneCategory(item.category) : true))
      .map((item) => rankProduct(item, intent));

    ragLog("ranking:top_scored", {
      top: rankedCandidates
        .sort((a, b) => b.score - a.score || b.price - a.price)
        .slice(0, 5)
        .map((item) => summarizeCandidateForLog(item)),
    });

    const budgetPicked = pickCandidatesByBudget(rankedCandidates, intent.budget, 3);
    ragLog("ranking:budget_selection", {
      strategy: budgetPicked.strategy,
      selected: budgetPicked.items.map((item) => summarizeCandidateForLog(item)),
    });

    const mapped = budgetPicked.items.map(
      ({ score: _score, ...candidate }) => candidate
    );

    return mapped;
  } catch (_error) {
    return [];
  }
};
const extractProductCandidates = (documents: Document[]): ProductCandidate[] => {
  const candidates: ProductCandidate[] = [];

  for (const doc of documents) {
    const metadata = (doc.metadata || {}) as Record<string, unknown>;
    if (metadata.doc_type !== "product") {
      continue;
    }

    const product_id = Number(metadata.product_id);
    const product_name = String(metadata.product_name || "");
    const category = String(metadata.category || "");
    const brand = String(metadata.brand || "");
    const price = Number(metadata.price);
    const stock = Number(metadata.stock);

    if (!product_id || !product_name) {
      continue;
    }

    candidates.push({
      product_id,
      product_name,
      category,
      brand,
      price: Number.isFinite(price) ? price : 0,
      stock: Number.isFinite(stock) ? stock : 0,
    });
  }

  const uniqueMap = new Map<number, ProductCandidate>();
  for (const candidate of candidates) {
    uniqueMap.set(candidate.product_id, candidate);
  }

  return Array.from(uniqueMap.values());
};

const unwrapJsonPayload = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("```")) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return trimmed;
};

const containsNoDataIntent = (text: string) => {
  const normalized = normalizeVietnameseText(text);
  const patterns = [
    "chua co thong tin",
    "khong co thong tin",
    "chua co mau",
    "khong co mau",
    "chua tim thay san pham",
    "khong tim thay san pham",
    "chua co du lieu",
    "khong co du lieu",
  ];

  return patterns.some((pattern) => normalized.includes(pattern));
};

const shouldEnforceProductFallback = (question: string, queryType: string) => {
  if (queryType !== "vector_store") {
    return false;
  }

  return detectQueryIntentKind(question) === "product";
};

const enforceProductFallback = (
  rawResponse: string,
  productCandidates: ProductCandidate[],
  question: string
) => {
  if (productCandidates.length === 0) {
    return rawResponse;
  }

  try {
    const payload = unwrapJsonPayload(rawResponse);
    const parsed = JSON.parse(payload) as Record<string, unknown>;

    const parsedProducts = Array.isArray(parsed.products) ? parsed.products : [];
    const parsedText =
      typeof parsed.responseText === "string" ? parsed.responseText : "";
    const hasNoDataIntent = containsNoDataIntent(parsedText);
    const intent = detectProductIntent(question);
    const requiresStructuredCandidates =
      intent.wantsGaming || intent.wantsCamera || intent.wantsPhone || Boolean(intent.budget);
    const hasStructuredProduct = parsedProducts.some((item) => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return Number.isFinite(Number(candidate.product_id));
    });

    if (
      parsedProducts.length > 0 &&
      !hasNoDataIntent &&
      (!requiresStructuredCandidates || hasStructuredProduct)
    ) {
      return JSON.stringify(parsed);
    }

    const fallbackProducts = productCandidates.slice(0, 3);
    const fallbackResponse = {
      isListFormat: fallbackProducts.length >= 2,
      products: fallbackProducts,
      responseText:
        fallbackProducts.length >= 2
          ? "TechStore gợi ý một số mẫu phù hợp trong tầm giá bạn quan tâm:"
          : `TechStore gợi ý mẫu phù hợp: ${fallbackProducts[0]?.product_name}.`,
    };

    return JSON.stringify(fallbackResponse);
  } catch (_error) {
    const fallbackProducts = productCandidates.slice(0, 3);
    const fallbackResponse = {
      isListFormat: fallbackProducts.length >= 2,
      products: fallbackProducts,
      responseText:
        fallbackProducts.length >= 2
          ? "TechStore gợi ý một số mẫu phù hợp trong tầm giá bạn quan tâm:"
          : `TechStore gợi ý mẫu phù hợp: ${fallbackProducts[0]?.product_name}.`,
    };
    return JSON.stringify(fallbackResponse);
  }
};

const shouldBypassLLMForProductIntent = (
  question: string,
  queryType: string,
  productCandidates: ProductCandidate[]
) => {
  if (queryType !== "vector_store" || productCandidates.length === 0) {
    return false;
  }

  const intent = detectProductIntent(question);
  return intent.wantsGaming || intent.wantsCamera || Boolean(intent.budget);
};

const buildProductHighlights = (product: ProductCandidate) => {
  const specs = product.specifications || {};
  const parts: string[] = [];
  
  const rearCamera = getSpecValue(specs, ["Rear camera (MP)", "rear_camera_mp"]);
  const frontCamera = getSpecValue(specs, ["Front camera (MP)", "front_camera_mp"]);
  const ram = getSpecValue(specs, ["RAM (GB)", "ram_gb"]);
  const storage = getSpecValue(specs, ["Storage (GB)", "storage_gb"]);
  const refreshRate = getSpecValue(specs, ["Refresh rate (Hz)", "refresh_rate_hz"]);
  const battery = getSpecValue(specs, ["Battery (mAh)", "battery_mah"]);
  
  if (rearCamera) parts.push(`rear ${rearCamera}MP`);
  if (frontCamera) parts.push(`front ${frontCamera}MP`);
  if (ram) parts.push(`RAM ${ram}GB`);
  if (storage) parts.push(`storage ${storage}GB`);
  if (refreshRate) parts.push(`refresh ${refreshRate}Hz`);
  if (battery) parts.push(`battery ${battery}mAh`);
  
  return parts.slice(0, 4).join(", ");
};

const buildCandidateOnlyResponse = (
  question: string,
  productCandidates: ProductCandidate[]
) => {
  const topProducts = productCandidates.slice(0, 3);
  const intent = detectProductIntent(question);
  const budgetLabel = intent.budget
    ? `${intent.budget.toLocaleString("vi-VN")} VND`
    : "ngân sách bạn đưa ra";

  if (topProducts.length === 1) {
    const product = topProducts[0];
    const highlights = buildProductHighlights(product);
    return JSON.stringify({
      isListFormat: false,
      products: topProducts,
      responseText: highlights
        ? `Đã tìm thấy 1 mẫu phù hợp theo thông số kỹ thuật và mức giá gần ${budgetLabel}: ${product.product_name} (${highlights}).`
        : `Đã tìm thấy 1 mẫu phù hợp theo mức giá gần ${budgetLabel}: ${product.product_name}.`,
    });
  }

  return JSON.stringify({
    isListFormat: true,
    products: topProducts,
    responseText: `Đã tìm thấy ${topProducts.length} mẫu được xếp hạng theo thông số kỹ thuật và mức giá gần ${budgetLabel}.`,
  });
};

const generateAnswer = async (
  question: string,
  context: string,
  sessionId: string,
  conversationId: string,
  queryType: string,
  productCandidates: ProductCandidate[] = []
) => {
  try {
    ragLog("answer:start", {
      queryType,
      contextChars: context.length,
      productCandidates: productCandidates.length,
    });

    let responseText = "";
    if (shouldBypassLLMForProductIntent(question, queryType, productCandidates)) {
      responseText = buildCandidateOnlyResponse(question, productCandidates);
      ragLog("answer:forced_backend_candidates", {
        count: productCandidates.length,
        selected: productCandidates.map((item) => summarizeCandidateForLog(item)),
      });
    } else {
      const llm = initLLM();
      const streamingChain = createStreamingAnswerChain(llm);
      const history = await getChatHistory(sessionId);
      const historyText = await formatChatHistory(history);
      const fullResponse = await streamingChain.invoke({
        history: historyText,
        question,
        context,
      });

      const rawResponse = String(fullResponse);
      responseText = shouldEnforceProductFallback(question, queryType)
        ? enforceProductFallback(rawResponse, productCandidates, question)
        : rawResponse;
    }

    ragLog("answer:done", {
      responseChars: responseText.length,
      usedFallbackCandidates: productCandidates.length > 0,
    });

    await addMessageToHistory(sessionId, { role: "user", content: question });
    await addMessageToHistory(sessionId, { role: "assistant", content: responseText });

    await saveConversation({
      _id: conversationId,
      sessionId,
      queryType,
      question,
      context,
      answer: responseText,
      status: "completed",
      completedAt: new Date(),
    });

    return responseText;
  } catch (err) {
    throw err;
  }
};

const processUserQuery = async (question: string, sessionId: string) => {
  let conversationId = "";

  try {
    ragLog("query:start", { sessionId, question });

    conversationId = await saveConversation({
      sessionId,
      question,
      status: "in_progress",
      startedAt: new Date(),
    });

    const queryType = await classifyUserQuery(question, sessionId);
    ragLog("query:type", { queryType });

    if (queryType === "casual_convo") {
      return await generateAnswer(
        question,
        "",
        sessionId,
        conversationId,
        queryType
      );
    }

    if (queryType === "vector_store") {
      const intentKind = detectQueryIntentKind(question);
      ragLog("vector:intent_kind", { intentKind });

      const rewrittenQuery = await rewriteQuery(question, sessionId, "vector_search");
      const docs = await safeQueryCombinedResult(
        rewrittenQuery,
        sessionId,
        conversationId
      );
      ragLog("vector:retrieved", { docs: docs.length, rewrittenQuery });

      if (docs.length === 0) {
        ragLog("vector:no_docs");
        if (intentKind === "product") {
          const backendCandidates = await buildProductCandidatesFromBackend(question);
          ragLog("vector:no_docs_backend_candidates", {
            count: backendCandidates.length,
          });
          return await generateAnswer(
            question,
            "",
            sessionId,
            conversationId,
            queryType,
            backendCandidates
          );
        }

        const webSearchQuery = await rewriteQuery(question, sessionId, "web_search");
        const webContext = await buildExternalWebContext(
          webSearchQuery,
          sessionId,
          conversationId
        );
        return await generateAnswer(
          question,
          webContext,
          sessionId,
          conversationId,
          "web_context"
        );
      }

      const { relevantDocs } = DOCUMENT_EVALUATION_DISABLED
        ? { relevantDocs: docs }
        : await evaluateDocuments(rewrittenQuery, docs);
      ragLog("vector:relevant_docs", { docs: relevantDocs.length });

      const prioritizedDocs = prioritizeDocumentsByIntent(relevantDocs, intentKind);
      let context = buildBoundedContext(prioritizedDocs);
      let productCandidates =
        intentKind === "product" ? extractProductCandidates(prioritizedDocs) : [];
      ragLog("vector:candidates_from_docs", { count: productCandidates.length });

      const backendCandidates =
        intentKind === "product"
          ? await buildProductCandidatesFromBackend(question)
          : [];
      ragLog("vector:candidates_from_backend", { count: backendCandidates.length });

      if (productCandidates.length === 0) {
        productCandidates = backendCandidates;
      } else if (backendCandidates.length > 0) {
        const uniqueMap = new Map<number, ProductCandidate>();
        backendCandidates.forEach((item) => uniqueMap.set(item.product_id, item));
        productCandidates.forEach((item) => {
          if (!uniqueMap.has(item.product_id)) uniqueMap.set(item.product_id, item);
        });
        productCandidates = Array.from(uniqueMap.values()).slice(0, 3);
      }

      ragLog("vector:final_candidates", {
        count: productCandidates.length,
        selected: productCandidates.map((item) => summarizeCandidateForLog(item)),
      });

      const productId = extractProductIdFromQuestion(question);
      if (intentKind === "product" && productId) {
        const productDetail = await fetchProductDetails(
          productId,
          sessionId,
          conversationId
        );

        if (productDetail) {
          const productContext = formatProductDetailForContext(productDetail);
          context = context
            ? `${context}\n\n---\n\nMain backend product details:\n${productContext}`
            : `Main backend product details:\n${productContext}`;
        }
      }

      return await generateAnswer(
        question,
        context,
        sessionId,
        conversationId,
        queryType,
        productCandidates
      );
    }

    if (queryType === "web_context") {
      const webSearchQuery = await rewriteQuery(question, sessionId, "web_search");
      const webContext = await buildExternalWebContext(
        webSearchQuery,
        sessionId,
        conversationId
      );

      return await generateAnswer(
        question,
        webContext,
        sessionId,
        conversationId,
        queryType
      );
    }

    return "";
  } catch (err) {
    if (conversationId) {
      await saveConversation({
        _id: conversationId,
        sessionId,
        question,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown chat error",
      });
    }

    throw err;
  }
};

export default processUserQuery;
