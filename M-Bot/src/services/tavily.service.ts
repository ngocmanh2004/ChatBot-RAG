import axios from "axios";
import type { Document } from "langchain/document";
import { safeSaveApiInteraction } from "./conversations.service";

const TAVILY_API_KEY = Bun.env.TAVILY_API_KEY;
const TAVILY_DISABLED = Bun.env.TAVILY_DISABLED === "true";
const TAVILY_ENDPOINT = "https://api.tavily.com/search";

const searchProductFromTavily = async (
  query: string,
  sessionId?: string,
  conversationId?: string
) => {
  if (TAVILY_DISABLED || !TAVILY_API_KEY) {
    await safeSaveApiInteraction({
      provider: "tavily",
      endpoint: TAVILY_ENDPOINT,
      sessionId,
      conversationId,
      query,
      requestPayload: { query },
      responsePayload: null,
      success: false,
      errorMessage: TAVILY_DISABLED
        ? "TAVILY_DISABLED=true"
        : "Missing TAVILY_API_KEY",
    });

    return null;
  }

  try {
    const { data } = await axios.post(
      TAVILY_ENDPOINT,
      {
        query,
        search_depth: "advanced",
        include_answer: true,
        include_domains: [],
        exclude_domains: [],
        max_results: 4,
        api_key: TAVILY_API_KEY,
      },
      { timeout: 12000 }
    );

    const results = Array.isArray(data?.results) ? data.results : [];

    await safeSaveApiInteraction({
      provider: "tavily",
      endpoint: TAVILY_ENDPOINT,
      sessionId,
      conversationId,
      query,
      requestPayload: { query, max_results: 4 },
      responsePayload: {
        answer: data?.answer || "",
        resultCount: results.length,
        results: results.slice(0, 4).map((item: any) => ({
          title: item?.title || "",
          url: item?.url || "",
          content: item?.content || "",
        })),
      },
      success: true,
    });

    if (results.length === 0) {
      return null;
    }

    const content = results
      .map((result: any) => {
        const title = result?.title ? `${result.title}\n` : "";
        const snippet = result?.content || "";
        const url = result?.url ? `\nNguon: ${result.url}` : "";
        return `${title}${snippet}${url}`.trim();
      })
      .join("\n\n---\n\n");

    return {
      pageContent: content,
      metadata: {
        source: "tavily",
        query,
        resultCount: results.length,
      },
    } as Document;
  } catch (err) {
    await safeSaveApiInteraction({
      provider: "tavily",
      endpoint: TAVILY_ENDPOINT,
      sessionId,
      conversationId,
      query,
      requestPayload: { query },
      responsePayload: null,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown Tavily error",
    });

    return null;
  }
};

export { searchProductFromTavily };
export default searchProductFromTavily;
