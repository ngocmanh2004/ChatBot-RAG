type SessionCreateResponse = {
  statusCode?: number;
  isSuccess?: boolean;
  result?: string;
};

type ChatResponseEnvelope = {
  statusCode?: number;
  isSuccess?: boolean;
  result?: {
    responseText?: string;
  };
};

type NormalizedAssistantPayload = {
  isListFormat: boolean;
  products: unknown[];
  responseText: string;
  rawText: string;
};

type TestCase = {
  id: string;
  prompt: string;
  validate: (payload: NormalizedAssistantPayload) => {
    ok: boolean;
    reason: string;
  };
};

const BASE_URL = Bun.env.RAG_BASE_URL || "http://localhost:3000/api/v1";
const USER_ID = Number(Bun.env.RAG_TEST_USER_ID || "20260409");
const MAX_RETRIES_PER_CASE = Number(Bun.env.RAG_TEST_MAX_RETRIES || "2");
const DEFAULT_RETRY_DELAY_MS = Number(Bun.env.RAG_TEST_RETRY_DELAY_MS || "65000");

const testCases: TestCase[] = [
  {
    id: "general_knowledge",
    prompt: "Thương mại điện tử là gì?",
    validate: (payload) => {
      const text = payload.responseText.toLowerCase();
      const hasConcept =
        text.includes("thương mại điện tử") ||
        text.includes("e-commerce") ||
        text.includes("mua bán");
      const hasNoProductList = payload.products.length === 0;
      return {
        ok: hasConcept && hasNoProductList,
        reason:
          "Expected general definition and no product list for non-product question.",
      };
    },
  },
  {
    id: "policy_privacy",
    prompt: "Chính sách bảo mật thông tin của TechStore là gì?",
    validate: (payload) => {
      const text = payload.responseText.toLowerCase();
      const hasPolicySignal =
        text.includes("bảo mật") ||
        text.includes("thông tin cá nhân") ||
        text.includes("dữ liệu");
      return {
        ok: hasPolicySignal,
        reason: "Expected privacy/policy-related answer.",
      };
    },
  },
  {
    id: "faq_shipping",
    prompt: "Thời gian giao hàng bao lâu?",
    validate: (payload) => {
      const text = payload.responseText.toLowerCase();
      const hasShippingSignal =
        text.includes("giao hàng") ||
        text.includes("ngày") ||
        text.includes("vận chuyển");
      return {
        ok: hasShippingSignal,
        reason: "Expected shipping FAQ-related answer.",
      };
    },
  },
  {
    id: "product_recommendation",
    prompt: "Tư vấn điện thoại chụp ảnh đẹp tầm 20 triệu",
    validate: (payload) => {
      const hasProducts = Array.isArray(payload.products) && payload.products.length > 0;
      const text = payload.responseText.toLowerCase();
      const hasRecommendationSignal =
        text.includes("gợi ý") ||
        text.includes("phù hợp") ||
        text.includes("mẫu");
      return {
        ok: hasProducts || hasRecommendationSignal,
        reason: "Expected recommendation response for product intent.",
      };
    },
  },
];

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

const normalizeAssistantPayload = (rawText: string): NormalizedAssistantPayload => {
  const base: NormalizedAssistantPayload = {
    isListFormat: false,
    products: [],
    responseText: rawText,
    rawText,
  };

  if (!rawText.trim()) {
    return base;
  }

  try {
    const unwrapped = unwrapJsonPayload(rawText);
    const parsed = JSON.parse(unwrapped) as Record<string, unknown>;
    return {
      isListFormat: Boolean(parsed.isListFormat),
      products: Array.isArray(parsed.products) ? parsed.products : [],
      responseText:
        typeof parsed.responseText === "string" ? parsed.responseText : rawText,
      rawText,
    };
  } catch {
    return base;
  }
};

const createSession = async () => {
  const response = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Create session failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as SessionCreateResponse;
  const sessionId = json?.result || "";
  if (!sessionId) {
    throw new Error("Create session succeeded but sessionId is empty.");
  }

  return sessionId;
};

const sendMessage = async (sessionId: string, prompt: string) => {
  const response = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Send message failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as ChatResponseEnvelope;
  return json?.result?.responseText || "";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractRetryDelayMs = (errorMessage: string) => {
  const retryInMatch = errorMessage.match(/retry in\s+([\d.]+)s/i);
  if (retryInMatch?.[1]) {
    const seconds = Number(retryInMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000) + 1000;
    }
  }

  const retryDelayMatch = errorMessage.match(/\"retryDelay\":\"(\d+)s\"/i);
  if (retryDelayMatch?.[1]) {
    const seconds = Number(retryDelayMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000) + 1000;
    }
  }

  return DEFAULT_RETRY_DELAY_MS;
};

const sendMessageWithRetry = async (
  sessionId: string,
  prompt: string,
  caseId: string
) => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= MAX_RETRIES_PER_CASE) {
    try {
      return await sendMessage(sessionId, prompt);
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const isQuotaLike =
        message.includes("429") ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("rate limit");

      if (!isQuotaLike || attempt === MAX_RETRIES_PER_CASE) {
        throw err;
      }

      const delay = extractRetryDelayMs(message);
      console.log(
        `[RETRY] ${caseId} hit quota/rate-limit. Waiting ${delay}ms before retry ${attempt + 1}/${MAX_RETRIES_PER_CASE}...`
      );
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unknown retry failure");
};

const printResult = (
  id: string,
  elapsedMs: number,
  ok: boolean,
  reason: string,
  payload: NormalizedAssistantPayload
) => {
  const status = ok ? "PASS" : "FAIL";
  const preview = payload.responseText.replace(/\s+/g, " ").trim().slice(0, 180);
  console.log(`[${status}] ${id} (${elapsedMs}ms)`);
  console.log(`  reason: ${reason}`);
  console.log(`  products: ${payload.products.length}`);
  console.log(`  response: ${preview}${payload.responseText.length > 180 ? "..." : ""}`);
};

const main = async () => {
  console.log(`[RAG Smoke Test] BASE_URL=${BASE_URL}`);
  const sessionId = await createSession();
  console.log(`[RAG Smoke Test] sessionId=${sessionId}`);

  let passed = 0;
  let failed = 0;
  let errored = 0;
  const total = testCases.length;

  for (const testCase of testCases) {
    try {
      const started = Date.now();
      const raw = await sendMessageWithRetry(
        sessionId,
        testCase.prompt,
        testCase.id
      );
      const elapsed = Date.now() - started;
      const normalized = normalizeAssistantPayload(raw);
      const verdict = testCase.validate(normalized);
      if (verdict.ok) {
        passed += 1;
      } else {
        failed += 1;
      }
      printResult(testCase.id, elapsed, verdict.ok, verdict.reason, normalized);
    } catch (err) {
      errored += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[ERROR] ${testCase.id}: ${message}`);
    }
  }

  console.log(
    `[RAG Smoke Test] Summary: passed=${passed}, failed=${failed}, errored=${errored}, total=${total}`
  );
  if (failed > 0 || errored > 0) {
    process.exit(1);
  }
};

main().catch((err) => {
  console.error("[RAG Smoke Test] Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
