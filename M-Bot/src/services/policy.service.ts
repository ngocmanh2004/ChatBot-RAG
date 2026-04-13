import axios from "axios";
import { Document } from "@langchain/core/documents";
import { safeSaveApiInteraction } from "./conversations.service";

interface PolicyItem {
  title: string;
  content: string;
  policy_type: "return" | "shipping" | "warranty" | "payment" | "privacy";
}

const MAIN_BACKEND_API = Bun.env.MAIN_BACKEND_API || "";
const MAIN_BACKEND_POLICY_ENDPOINT = Bun.env.MAIN_BACKEND_POLICY_ENDPOINT || "";
const MAIN_BACKEND_TIMEOUT = 12000;

const DEFAULT_POLICIES: PolicyItem[] = [
  {
    title: "Chinh sach doi tra",
    policy_type: "return",
    content:
      "Khach hang co the doi tra trong vong 7 ngay ke tu ngay nhan hang neu san pham con nguyen hop, day du phu kien va dap ung dieu kien doi tra.",
  },
  {
    title: "Chinh sach van chuyen",
    policy_type: "shipping",
    content:
      "Mien phi van chuyen cho don tu 500.000 VND. Thoi gian giao hang tuy khu vuc, thuong tu 1-5 ngay lam viec.",
  },
  {
    title: "Chinh sach bao hanh",
    policy_type: "warranty",
    content:
      "San pham duoc bao hanh chinh hang theo thoi han cong bo cua tung danh muc san pham va thuong hieu.",
  },
  {
    title: "Chinh sach thanh toan",
    policy_type: "payment",
    content:
      "Ho tro nhieu phuong thuc thanh toan: chuyen khoan, the, vi dien tu va COD theo dieu kien ap dung.",
  },
  {
    title: "Chinh sach bao mat thong tin",
    policy_type: "privacy",
    content:
      "TechStore chi thu thap du lieu can thiet de xu ly don hang, cham soc khach hang va cai thien dich vu. Thong tin ca nhan duoc luu tru an toan, khong chia se cho ben thu ba trai phep va khach hang co the yeu cau cap nhat hoac xoa du lieu theo quy dinh hien hanh.",
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

const detectPolicyType = (rawValue: unknown): PolicyItem["policy_type"] => {
  const value = toSafeString(rawValue).toLowerCase();

  if (
    value.includes("bao mat") ||
    value.includes("rieng tu") ||
    value.includes("privacy")
  ) {
    return "privacy";
  }
  if (value.includes("ship") || value.includes("van chuyen")) {
    return "shipping";
  }
  if (value.includes("warranty") || value.includes("bao hanh")) {
    return "warranty";
  }
  if (value.includes("payment") || value.includes("thanh toan")) {
    return "payment";
  }

  return "return";
};

const parsePolicyItems = (data: unknown): PolicyItem[] => {
  const normalizeItem = (raw: Record<string, unknown>): PolicyItem | null => {
    const title = toSafeString(raw.title ?? raw.name);
    const content = toSafeString(raw.content ?? raw.description ?? raw.text);

    if (!title || !content) {
      return null;
    }

    return {
      title,
      content,
      policy_type: detectPolicyType(raw.policy_type ?? raw.type ?? title),
    };
  };

  const toNormalized = (items: unknown[]) =>
    items
      .filter((item) => item && typeof item === "object")
      .map((item) => normalizeItem(item as Record<string, unknown>))
      .filter((item): item is PolicyItem => Boolean(item));

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

const resolvePolicyEndpoint = () => {
  if (MAIN_BACKEND_POLICY_ENDPOINT) {
    return MAIN_BACKEND_POLICY_ENDPOINT;
  }

  if (!MAIN_BACKEND_API) {
    return "";
  }

  return `${normalizeMainBackendApi()}/api/policies`;
};

const fetchPolicyItemsFromBackend = async (): Promise<PolicyItem[]> => {
  const endpoint = resolvePolicyEndpoint();

  if (!endpoint) {
    return [];
  }

  try {
    const { data } = await axios.get(endpoint, { timeout: MAIN_BACKEND_TIMEOUT });
    const items = parsePolicyItems(data);

    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint,
      requestPayload: null,
      responsePayload: { resultCount: items.length, preview: items.slice(0, 3) },
      success: true,
      metadata: { dataType: "policy" },
    });

    return items;
  } catch (err) {
    await safeSaveApiInteraction({
      provider: "main_backend",
      endpoint,
      requestPayload: null,
      responsePayload: null,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Failed to fetch policy data",
      metadata: { dataType: "policy" },
    });

    return [];
  }
};

const getPolicyItems = async () => {
  const fromBackend = await fetchPolicyItemsFromBackend();
  if (fromBackend.length > 0) {
    return fromBackend;
  }

  return DEFAULT_POLICIES;
};

const getAllPolicyDocuments = async (): Promise<Document[]> => {
  const policies = await getPolicyItems();

  return policies.map(
    (policy) =>
      new Document({
        pageContent: `${policy.title}: ${policy.content}`,
        metadata: {
          doc_type: "policy",
          policy_type: policy.policy_type,
          title: policy.title,
        },
      })
  );
};

export default getAllPolicyDocuments;
