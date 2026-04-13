import type { Request, Response } from "express";
import { syncAllDocumentsToVectorStore } from "../services/vectorStore.service";
import { queryCombinedResult } from "../services/vectorStore.service";
import { fetchAllProducts } from "../services/product.service";
import { successResponse, errorResponse } from "../utils/response.util";
import type Product from "../models/product.model";

const mapPreviewProduct = (item: Product) => {
  const specifications = item.specifications || {};

  return {
    product_id: item.product_id,
    product_name: item.product_name,
    category: item.category,
    brand: item.brand,
    price: item.price,
    stock: item.stock,
    specifications,
    performance: {
      cpu: specifications["CPU"] ?? null,
      gpu: specifications["GPU"] ?? null,
      ram_gb: specifications["RAM (GB)"] ?? null,
      storage_gb: specifications["Storage (GB)"] ?? null,
      battery_mah: specifications["Battery (mAh)"] ?? null,
      refresh_rate_hz: specifications["Refresh rate (Hz)"] ?? null,
    },
  };
};

const syncProductsController = async (req: Request, res: Response) => {
  try {
    const totalDocuments = await syncAllDocumentsToVectorStore();
    successResponse(res, 200, { totalDocuments });
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(
        res,
        500,
        "Internal Server Error",
        "An unexpected error occurred while syncing documents. Please try again later!"
      );
    }
  }
};

const previewProductsController = async (_req: Request, res: Response) => {
  try {
    const products = await fetchAllProducts("debug_session", "debug_preview_products");
    const phoneUnder20m = products.filter(
      (item) => item.category.toLowerCase().includes("điện thoại") && item.price <= 20000000
    );

    successResponse(res, 200, {
      totalProducts: products.length,
      phoneUnder20mCount: phoneUnder20m.length,
      sampleProducts: products.slice(0, 10).map((item) => ({
        ...mapPreviewProduct(item),
      })),
      samplePhoneUnder20m: phoneUnder20m.slice(0, 10).map((item) => ({
        ...mapPreviewProduct(item),
      })),
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(
        res,
        500,
        "Internal Server Error",
        `Preview products failed: ${err.message}`
      );
    }
  }
};

const previewVectorController = async (req: Request, res: Response) => {
  try {
    const query =
      typeof req.query.q === "string" && req.query.q.trim()
        ? req.query.q.trim()
        : "điện thoại chơi game 20 triệu";

    const docs = await queryCombinedResult(
      query,
      "debug_session",
      "debug_preview_vector"
    );

    successResponse(res, 200, {
      query,
      totalDocs: docs.length,
      topDocs: docs.slice(0, 10).map((doc) => ({
        contentPreview: doc.pageContent.slice(0, 240),
        metadata: doc.metadata,
      })),
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(
        res,
        500,
        "Internal Server Error",
        `Preview vector failed: ${err.message}`
      );
    }
  }
};

export { syncProductsController, previewProductsController, previewVectorController };
