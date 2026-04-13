import axios from "axios";
import { Document } from "@langchain/core/documents";
import { safeSaveApiInteraction } from "./conversations.service";

interface FaqItem {
  question: string;
  answer: string;
}

const MAIN_BACKEND_API = Bun.env.MAIN_BACKEND_API || "";
const MAIN_BACKEND_FAQ_ENDPOINT = Bun.env.MAIN_BACKEND_FAQ_ENDPOINT || "";
const MAIN_BACKEND_TIMEOUT = 12000;

const DEFAULT_FAQ_DATA: FaqItem[] = [
  {
    question: "Địa chỉ cửa hàng TechStore ở đâu?",
    answer:
      "TechStore có 3 chi nhánh chính: Chi nhánh 1 - 123 Nguyễn Văn Linh, Quận 7, TP.HCM. Chi nhánh 2 - 456 Lê Văn Việt, Quận 9, TP.HCM. Chi nhánh 3 - 789 Trần Hưng Đạo, Quận 1, TP.HCM. Thời gian mở cửa: 8h00 - 22h00 hàng ngày.",
  },
  {
    question: "Giờ mở cửa của TechStore là mấy giờ?",
    answer:
      "TechStore mở cửa từ 8h00 sáng đến 22h00 tối hàng ngày, kể cả thứ 7 và Chủ nhật. Các ngày lễ Tết có thể điều chỉnh giờ mở cửa.",
  },
  {
    question: "Số điện thoại liên hệ TechStore là gì?",
    answer:
      "Hotline TechStore: 1900-xxxx (miễn phí). Email: support@techstore.vn. Hoặc liên hệ trực tiếp qua Zalo/Facebook Messenger của TechStore.",
  },


  {
    question: "Các phương thức thanh toán được chấp nhận?",
    answer:
      "Chúng tôi hỗ trợ chuyển khoản ngân hàng, thẻ ATM nội địa, Visa/Mastercard, ví điện tử và COD theo điều kiện áp dụng.",
  },


  {
    question: "TechStore có bán hàng trực tuyến không?",
    answer:
      "Có, TechStore hỗ trợ mua hàng trực tuyến qua website và app. Quý khách có thể đặt hàng online và nhận hàng tại nhà hoặc đến cửa hàng nhận.",
  },
  {
    question: "Làm thế nào để kiểm tra bảo hành sản phẩm?",
    answer:
      "Quý khách mang sản phẩm và phiếu bảo hành đến bất kỳ chi nhánh TechStore nào. Nhân viên sẽ kiểm tra và hỗ trợ bảo hành theo chính sách.",
  },
];

const normalizeMainBackendApi = () => MAIN_BACKEND_API.replace(/\/+$/, "");

const toSafeString = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const parseFaqItems = (data: unknown): FaqItem[] => {
  const normalizeItem = (raw: Record<string, unknown>): FaqItem | null => {
    const question = toSafeString(raw.question ?? raw.title ?? raw.q);
    const answer = toSafeString(raw.answer ?? raw.content ?? raw.a);

    if (!question || !answer) {
      return null;
    }

    return { question, answer };
  };

  const toNormalized = (items: unknown[]) =>
    items
      .filter((item) => item && typeof item === "object")
      .map((item) => normalizeItem(item as Record<string, unknown>))
      .filter((item): item is FaqItem => Boolean(item));

  if (Array.isArray(data)) {
    return toNormalized(data);
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
      return toNormalized(obj.data);
    }

    if (
      obj.result &&
      typeof obj.result === "object" &&
      Array.isArray((obj.result as Record<string, unknown>).data)
    ) {
      return toNormalized((obj.result as Record<string, unknown>).data as unknown[]);
    }
  }

  return [];
};

const resolveFaqEndpoint = () => {
  if (MAIN_BACKEND_FAQ_ENDPOINT) {
    return MAIN_BACKEND_FAQ_ENDPOINT;
  }

  if (!MAIN_BACKEND_API) {
    return "";
  }

  return `${normalizeMainBackendApi()}/api/faqs`;
};

const fetchFaqItemsFromBackend = async (): Promise<FaqItem[]> => {
  const endpoint = resolveFaqEndpoint();

  if (!endpoint) {
    return [];
  }

  try {
    const { data } = await axios.get(endpoint, { timeout: MAIN_BACKEND_TIMEOUT });
    const items = parseFaqItems(data);

    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint,
      requestPayload: null,
      responsePayload: { resultCount: items.length, preview: items.slice(0, 3) },
      success: true,
      metadata: { dataType: "faq" },
    });

    return items;
  } catch (err) {
    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint,
      requestPayload: null,
      responsePayload: null,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Failed to fetch FAQ data",
      metadata: { dataType: "faq" },
    });

    return [];
  }
};

const getFaqItems = async () => {
  const fromBackend = await fetchFaqItemsFromBackend();
  if (fromBackend.length > 0) {
    return fromBackend;
  }

  return DEFAULT_FAQ_DATA;
};

const getAllFaqDocuments = async (): Promise<Document[]> => {
  const faqItems = await getFaqItems();

  return faqItems.map(
    (faq) =>
      new Document({
        pageContent: `Câu hỏi: ${faq.question}\nTrả lời: ${faq.answer}`,
        metadata: {
          doc_type: "faq",
          question: faq.question,
        },
      })
  );
};

export default getAllFaqDocuments;
