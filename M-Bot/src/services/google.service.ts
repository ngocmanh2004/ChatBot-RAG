import axios from "axios";
import type { Document } from "langchain/document";
import { safeSaveApiInteraction } from "./conversations.service";

const GOOGLE_API_KEY = Bun.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID =
  Bun.env.GOOGLE_CSE_ID || Bun.env.GOOGLE_SEARCH_ENGINE_ID || "";
const GOOGLE_SEARCH_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const GOOGLE_SEARCH_DISABLED = Bun.env.GOOGLE_SEARCH_DISABLED === "true";

const searchFromGoogle = async (
  query: string,
  sessionId?: string,
  conversationId?: string
) => {
  if (GOOGLE_SEARCH_DISABLED || !GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    await safeSaveApiInteraction({
      provider: "google",
      endpoint: GOOGLE_SEARCH_ENDPOINT,
      sessionId,
      conversationId,
      query,
      requestPayload: { query },
      responsePayload: null,
      success: false,
      errorMessage: GOOGLE_SEARCH_DISABLED
        ? "GOOGLE_SEARCH_DISABLED=true"
        : "Missing GOOGLE_API_KEY or GOOGLE_CSE_ID",
    });

    return null;
  }

  try {
    const { data } = await axios.get(GOOGLE_SEARCH_ENDPOINT, {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: 4,
        hl: "vi",
      },
      timeout: 12000,
    });

    const items = Array.isArray(data?.items) ? data.items : [];

    await safeSaveApiInteraction({
      provider: "google",
      endpoint: GOOGLE_SEARCH_ENDPOINT,
      sessionId,
      conversationId,
      query,
      requestPayload: { query, num: 4 },
      responsePayload: {
        resultCount: items.length,
        results: items.slice(0, 4).map((item: any) => ({
          title: item?.title || "",
          snippet: item?.snippet || "",
          link: item?.link || "",
        })),
      },
      success: true,
    });

    if (items.length === 0) {
      return null;
    }

    const content = items
      .map((item: any) => {
        const title = item?.title ? `${item.title}\n` : "";
        const snippet = item?.snippet || "";
        const link = item?.link ? `\nNguon: ${item.link}` : "";
        return `${title}${snippet}${link}`.trim();
      })
      .join("\n\n---\n\n");

    return {
      pageContent: content,
      metadata: {
        source: "google_custom_search",
        query,
        resultCount: items.length,
      },
    } as Document;
  } catch (err) {
    await safeSaveApiInteraction({
      provider: "google",
      endpoint: GOOGLE_SEARCH_ENDPOINT,
      sessionId,
      conversationId,
      query,
      requestPayload: { query },
      responsePayload: null,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown Google error",
    });

    return null;
  }
};

export { searchFromGoogle };

