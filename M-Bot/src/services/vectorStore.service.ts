import { PineconeStore, PineconeTranslator } from "@langchain/pinecone";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { TaskType } from "@google/generative-ai";
import initVectorStore from "../config/pinecone.config";
import initLLM from "../config/llm.config";
import initEmbeddingModel from "../config/embedding.config";
import ProductAttribute from "../models/productAttribute.model";
import getAllProductDocuments from "./product.service";
import getAllFaqDocuments from "./faq.service";
import getAllPolicyDocuments from "./policy.service";
import getAllDocumentChunks from "./document.service";
import getAllDropboxDocuments from "./dropbox.service";
import { safeSaveApiInteraction } from "./conversations.service";

let vectorStoreForDocument: PineconeStore | null = null;
let vectorStoreForSemanticSimilarity: PineconeStore | null = null;
const SELF_QUERY_DISABLED = (Bun.env.SELF_QUERY_DISABLED || "false") === "true";
const SELF_QUERY_TOP_K = Number(Bun.env.SELF_QUERY_TOP_K || "3");
const SIMILARITY_TOP_K = Number(Bun.env.SIMILARITY_TOP_K || "3");

const initRetrievalDocumentEmbedding = () =>
  initEmbeddingModel(TaskType.RETRIEVAL_DOCUMENT);
const initRetrievalQueryEmbedding = () =>
  initEmbeddingModel(TaskType.RETRIEVAL_QUERY);

const syncAllDocumentsToVectorStore = async () => {
  try {
    const [productDocs, faqDocs, policyDocs, documentChunks, dropboxDocs] = await Promise.all([
      getAllProductDocuments(),
      getAllFaqDocuments(),
      getAllPolicyDocuments(),
      getAllDocumentChunks(),
      getAllDropboxDocuments(),
    ]);

    const allDocs = [...productDocs, ...faqDocs, ...policyDocs, ...documentChunks, ...dropboxDocs];

    if (allDocs.length === 0) {
      console.warn("[VectorStore] No documents available to sync.");
      return 0;
    }

    if (!vectorStoreForDocument) {
      vectorStoreForDocument = await initVectorStore(
        initRetrievalDocumentEmbedding
      );
    }

    await vectorStoreForDocument.addDocuments(allDocs);

    console.log(
      `[VectorStore] Synced ${productDocs.length} products, ${faqDocs.length} FAQs, ${policyDocs.length} policies, ${documentChunks.length} local docs, ${dropboxDocs.length} Dropbox docs.`
    );

    return allDocs.length;
  } catch (err) {
    throw err;
  }
};

const createSelfQueryRetriever = async () => {
  try {
    if (!vectorStoreForDocument) {
      vectorStoreForDocument = await initVectorStore(
        initRetrievalDocumentEmbedding
      );
    }

    const llm = initLLM();

    return SelfQueryRetriever.fromLLM({
      llm,
      vectorStore: vectorStoreForDocument,
      documentContents:
        "Product information, FAQs, and store policies for an electronics e-commerce store.",
      attributeInfo: ProductAttribute,
      structuredQueryTranslator: new PineconeTranslator(),
      searchParams: {
        k: SELF_QUERY_TOP_K,
      },
    });
  } catch (err) {
    throw err;
  }
};

const searchSimilarDocuments = async (
  query: string,
  limit: number = SIMILARITY_TOP_K
) => {
  try {
    if (!vectorStoreForSemanticSimilarity) {
      vectorStoreForSemanticSimilarity = await initVectorStore(
        initRetrievalQueryEmbedding
      );
    }

    return await vectorStoreForSemanticSimilarity.similaritySearch(query, limit);
  } catch (err) {
    throw err;
  }
};

const searchDocumentsWithSelfQuery = async (query: string) => {
  try {
    if (SELF_QUERY_DISABLED) {
      return [];
    }

    const retriever = await createSelfQueryRetriever();
    const result = await retriever.invoke(query);
    return result || [];
  } catch (err) {
    throw err;
  }
};

const queryCombinedResult = async (
  query: string,
  sessionId?: string,
  conversationId?: string
) => {
  try {
    const [selfQueryPromise, similarityPromise] = await Promise.allSettled([
      searchDocumentsWithSelfQuery(query),
      searchSimilarDocuments(query),
    ]);

    const selfQueryResult =
      selfQueryPromise.status === "fulfilled" ? selfQueryPromise.value : [];
    const similaritySearchResult =
      similarityPromise.status === "fulfilled" ? similarityPromise.value : [];

    if (selfQueryPromise.status === "rejected") {
      console.error(
        "[VectorStore] Self-query retrieval failed, fallback to similarity search:",
        selfQueryPromise.reason
      );
    }

    if (similarityPromise.status === "rejected") {
      console.error(
        "[VectorStore] Similarity retrieval failed:",
        similarityPromise.reason
      );
    }

    const combinedResult = [...selfQueryResult, ...similaritySearchResult];
    const uniqueResult = Array.from(
      new Map(
        combinedResult.map((document) => [document.pageContent, document])
      ).values()
    );

    await safeSaveApiInteraction({
      provider: "pinecone",
      endpoint: "queryCombinedResult",
      sessionId,
      conversationId,
      query,
      requestPayload: {
        query,
        selfQueryResultCount: selfQueryResult.length,
        similarityResultCount: similaritySearchResult.length,
        selfQueryStatus: selfQueryPromise.status,
        similarityStatus: similarityPromise.status,
      },
      responsePayload: {
        uniqueResultCount: uniqueResult.length,
        topResults: uniqueResult.slice(0, 5).map((doc) => ({
          contentPreview: doc.pageContent.slice(0, 240),
          metadata: doc.metadata,
        })),
      },
      success: true,
    });

    return uniqueResult;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Pinecone query failed";

    if (
      typeof errorMessage === "string" &&
      (errorMessage.includes("embedContent") ||
        errorMessage.includes("model") ||
        errorMessage.includes("404"))
    ) {
      console.error(
        "[VectorStore] Embedding model may be invalid. Check LLM_EMBEDDING_MODEL_NAME in .env."
      );
    }

    await safeSaveApiInteraction({
      provider: "pinecone",
      endpoint: "queryCombinedResult",
      sessionId,
      conversationId,
      query,
      requestPayload: { query },
      responsePayload: null,
      success: false,
      errorMessage,
    });

    throw err;
  }
};

export {
  syncAllDocumentsToVectorStore,
  searchSimilarDocuments,
  searchDocumentsWithSelfQuery,
  queryCombinedResult,
};
