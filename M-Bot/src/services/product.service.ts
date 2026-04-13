import { Document } from "@langchain/core/documents";
import type Product from "../models/product.model";
import axios from "axios";
import { safeSaveApiInteraction } from "./conversations.service";
import { 
  normalizeSpecifications, 
  extractSpecsFromRawProduct 
} from "../utils/spec.util";

const MAIN_BACKEND_API = Bun.env.MAIN_BACKEND_API || "";
const MAIN_BACKEND_TIMEOUT = 12000;

const normalizeMainBackendApi = () => MAIN_BACKEND_API.replace(/\/+$/, "");

type RawProduct = Record<string, unknown>;

const toSafeNumber = (value: unknown, fallback: number = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeString = (value: unknown, fallback: string = "") => {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const toSpecifications = (value: unknown): Record<string, string | number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce(
    (acc, [key, rawVal]) => {
      if (typeof rawVal === "string" || typeof rawVal === "number") {
        acc[key] = rawVal;
      }
      return acc;
    },
    {} as Record<string, string | number>
  );
};

const normalizeProduct = (raw: RawProduct): Product => {
  const derivedSpecs = extractSpecsFromRawProduct(raw);
  const providedSpecs = toSpecifications(raw.specifications);
  const normalizedProvided = normalizeSpecifications(providedSpecs);

  return {
    product_id: toSafeNumber(raw.product_id ?? raw.id),
    product_name: toSafeString(raw.product_name ?? raw.name, "Unknown product"),
    description: toSafeString(raw.description, ""),
    category: toSafeString(raw.category ?? raw.category_name, "Unknown category"),
    brand: toSafeString(raw.brand ?? raw.brand_name, "Unknown brand"),
    price: toSafeNumber(raw.price),
    stock: toSafeNumber(raw.stock ?? raw.quantity),
    specifications: {
      ...derivedSpecs,
      ...normalizedProvided,
    },
  };
};

const normalizeProductList = (items: unknown[]): Product[] => {
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => normalizeProduct(item as RawProduct))
    .filter((item) => item.product_id > 0);
};

const mapProductSummary = (product: Product) => ({
  product_id: product.product_id,
  product_name: product.product_name,
  category: product.category,
  brand: product.brand,
  price: product.price,
  stock: product.stock,
});

const parseProductsFromBackendResponse = (data: any): Product[] => {
  if (Array.isArray(data)) {
    return normalizeProductList(data);
  }

  if (data?.result?.data && Array.isArray(data.result.data)) {
    return normalizeProductList(data.result.data);
  }

  if (data?.data && Array.isArray(data.data)) {
    return normalizeProductList(data.data);
  }

  return [];
};

const parseSingleProductFromBackendResponse = (data: any): Product | null => {
  if (!data) {
    return null;
  }

  if (Array.isArray(data)) {
    const [product] = normalizeProductList(data);
    return product || null;
  }

  if (data?.result?.data && !Array.isArray(data.result.data)) {
    if (data.result.data && typeof data.result.data === "object") {
      return normalizeProduct(data.result.data as RawProduct);
    }
    return null;
  }

  if (data?.data && !Array.isArray(data.data)) {
    if (data.data && typeof data.data === "object") {
      return normalizeProduct(data.data as RawProduct);
    }
    return null;
  }

  if (data && typeof data === "object") {
    const normalized = normalizeProduct(data as RawProduct);
    return normalized.product_id > 0 ? normalized : null;
  }

  return null;
};

const formatProductDetailForContext = (product: Product) => {
  const specsText =
    product.specifications && Object.keys(product.specifications).length > 0
    ? Object.entries(product.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "No technical specifications";

  return [
    `Product ID: ${product.product_id}`,
    `Name: ${product.product_name}`,
    `Category: ${product.category}`,
    `Brand: ${product.brand}`,
    `Price: ${product.price.toLocaleString("vi-VN")} VND`,
    `Stock: ${product.stock}`,
    `Description: ${product.description}`,
    `Specifications: ${specsText}`,
  ].join("\n");
};

const mappingProductDocument = (product: Product) => {
  const specsText =
    product.specifications && Object.keys(product.specifications).length > 0
    ? Object.entries(product.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "No technical specifications";

  const stockText =
    product.stock > 0
      ? `In stock: ${product.stock} item(s).`
      : "Currently out of stock.";

  return {
    pageContent: `${product.product_name} is a ${product.category} product from ${product.brand}. Price: ${product.price.toLocaleString("vi-VN")} VND. ${stockText} Description: ${product.description}. Specifications: ${specsText}.`,
    metadata: {
      product_id: product.product_id,
      product_name: product.product_name,
      category: product.category,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      doc_type: "product",
    },
  };
};

const fetchAllProducts = async (
  sessionId?: string,
  conversationId?: string
): Promise<Product[]> => {
  if (!MAIN_BACKEND_API) {
    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint: "MAIN_BACKEND_API",
      sessionId,
      conversationId,
      requestPayload: null,
      responsePayload: null,
      success: false,
      errorMessage: "Missing MAIN_BACKEND_API",
    });

    return [];
  }

  const endpoint = `${normalizeMainBackendApi()}/api/products`;

  try {
    const { data } = await axios.get(endpoint, { timeout: MAIN_BACKEND_TIMEOUT });
    const products = parseProductsFromBackendResponse(data);

    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint,
      sessionId,
      conversationId,
      requestPayload: null,
      responsePayload: {
        resultCount: products.length,
        products: products.slice(0, 5).map(mapProductSummary),
      },
      success: true,
    });

    return products;
  } catch (err) {
    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint,
      sessionId,
      conversationId,
      requestPayload: null,
      responsePayload: null,
      success: false,
      errorMessage:
        err instanceof Error ? err.message : "Failed to fetch all products",
    });

    throw err;
  }
};

const fetchProductDetails = async (
  productId: string,
  sessionId?: string,
  conversationId?: string
) => {
  if (!MAIN_BACKEND_API) {
    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint: "MAIN_BACKEND_API",
      sessionId,
      conversationId,
      query: productId,
      requestPayload: { productId },
      responsePayload: null,
      success: false,
      errorMessage: "Missing MAIN_BACKEND_API",
    });

    return null;
  }

  const baseUrl = normalizeMainBackendApi();
  const encodedProductId = encodeURIComponent(productId);
  const detailEndpoints = [
    `${baseUrl}/api/products/${encodedProductId}`,
    `${baseUrl}/api/products/details/${encodedProductId}`,
  ];

  for (const endpoint of detailEndpoints) {
    try {
      const { data } = await axios.get(endpoint, { timeout: MAIN_BACKEND_TIMEOUT });
      const product = parseSingleProductFromBackendResponse(data);

      if (product) {
        await safeSaveApiInteraction({
          provider: "main_backend",
          endpoint,
          sessionId,
          conversationId,
          query: productId,
          requestPayload: { productId },
          responsePayload: mapProductSummary(product),
          success: true,
        });

        return product;
      }
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;

      if (statusCode && statusCode < 500) {
        continue;
      }

      await safeSaveApiInteraction({
        provider: "main_backend",
        endpoint,
        sessionId,
        conversationId,
        query: productId,
        requestPayload: { productId },
        responsePayload: null,
        success: false,
        errorMessage:
          err instanceof Error ? err.message : "Failed to fetch product details",
      });
    }
  }

  try {
    const products = await fetchAllProducts(sessionId, conversationId);
    const product = products.find((item) => String(item.product_id) === String(productId));

    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint: `${baseUrl}/api/products`,
      sessionId,
      conversationId,
      query: productId,
      requestPayload: { productId, fallback: "search-in-all-products" },
      responsePayload: product ? mapProductSummary(product) : null,
      success: Boolean(product),
      errorMessage: product ? undefined : "Product not found by id",
    });

    return product || null;
  } catch (_fallbackError) {
    return null;
  }
};

const getAllProductDocuments = async (): Promise<Document[]> => {
  try {
    const products = await fetchAllProducts();
    return products.map((product) => {
      const mapped = mappingProductDocument(product);
      return new Document({
        pageContent: mapped.pageContent,
        metadata: mapped.metadata,
      });
    });
  } catch (err) {
    throw err;
  }
};

export {
  fetchAllProducts,
  fetchProductDetails,
  formatProductDetailForContext,
};

export default getAllProductDocuments;
