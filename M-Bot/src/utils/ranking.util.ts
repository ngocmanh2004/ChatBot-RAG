import {
  CHIPSET_TIER_CONFIG,
  INTENT_PATTERNS,
  BUDGET_PATTERNS,
  BUDGET_BANDS,
  RANKING_WEIGHTS,
  CATEGORY_PATTERNS,
  type RankingWeights,
} from "../config/product.config";
import { getSpecValue } from "./spec.util";

export const normalizeVietnameseText = (input: string): string => {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d");
};

export const calculateChipsetScore = (
  specs: Record<string, string | number>
): number => {
  const cpuText = String(specs["CPU"] || specs["cpu_chip"] || "").toLowerCase();
  const gpuText = String(specs["GPU"] || specs["gpu"] || "").toLowerCase();
  const merged = `${cpuText} ${gpuText}`;

  let totalScore = 0;

  for (const { pattern, score } of CHIPSET_TIER_CONFIG) {
    if (pattern.test(merged)) {
      totalScore += score;
    }
  }

  return totalScore;
};

export const detectBudget = (question: string): number | null => {
  const normalized = normalizeVietnameseText(question);

  for (const { pattern, multiplier } of BUDGET_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1].replace(",", "."));
      if (Number.isFinite(value)) {
        return Math.round(value * multiplier);
      }
    }
  }

  return null;
};

export const detectCategory = (text: string): string | null => {
  const normalized = normalizeVietnameseText(text);

  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(normalized)) {
      return category;
    }
  }

  return null;
};

export const isPhoneCategory = (category: string): boolean => {
  const normalized = normalizeVietnameseText(category || "");
  return CATEGORY_PATTERNS.phone.test(normalized);
};

export interface ProductIntent {
  wantsPhone: boolean;
  wantsGaming: boolean;
  wantsCamera: boolean;
  budget: number | null;
  category: string | null;
}

export const detectProductIntent = (question: string): ProductIntent => {
  const normalized = normalizeVietnameseText(question);

  const wantsPhone = INTENT_PATTERNS.phone.keywords.some(kw => 
    normalized.includes(kw)
  );

  const wantsGaming = INTENT_PATTERNS.gaming.keywords.some(kw => 
    normalized.includes(kw)
  );

  const wantsCamera = INTENT_PATTERNS.camera.keywords.some(kw => 
    normalized.includes(kw)
  );

  return {
    wantsPhone,
    wantsGaming,
    wantsCamera,
    budget: detectBudget(question),
    category: detectCategory(question),
  };
};

export interface ProductCandidate {
  product_id: number;
  product_name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  specifications?: Record<string, string | number>;
}

export interface RankedCandidate extends ProductCandidate {
  score: number;
}

export const calculateProductScore = (
  product: ProductCandidate,
  intent: ProductIntent
): number => {
  const specs = product.specifications || {};

  const ram = getSpecValue(specs, ["RAM (GB)", "ram_gb"]);
  const storage = getSpecValue(specs, ["Storage (GB)", "storage_gb"]);
  const refreshRate = getSpecValue(specs, ["Refresh rate (Hz)", "refresh_rate_hz"]);
  const battery = getSpecValue(specs, ["Battery (mAh)", "battery_mah"]);
  const fastCharge = getSpecValue(specs, ["Fast charge (W)", "fast_charge_w"]);
  const rearCamera = getSpecValue(specs, ["Rear camera (MP)", "rear_camera_mp"]);
  const frontCamera = getSpecValue(specs, ["Front camera (MP)", "front_camera_mp"]);
  const screenSize = getSpecValue(specs, ["Screen size (inch)", "screen_size_inch"]);
  const chipsetTier = calculateChipsetScore(specs);

  let weights: RankingWeights;
  if (intent.wantsGaming && !intent.wantsCamera) {
    weights = RANKING_WEIGHTS.gaming;
  } else if (intent.wantsCamera && !intent.wantsGaming) {
    weights = RANKING_WEIGHTS.camera;
  } else {
    weights = RANKING_WEIGHTS.balanced;
  }

  const score =
    ram * weights.ram +
    storage * weights.storage +
    refreshRate * weights.refreshRate +
    battery * weights.battery +
    fastCharge * weights.fastCharge +
    chipsetTier * weights.chipsetTier +
    rearCamera * weights.rearCamera +
    frontCamera * weights.frontCamera +
    screenSize * weights.screenSize;

  return score;
};

export const rankProduct = (
  product: ProductCandidate,
  intent: ProductIntent
): RankedCandidate => {
  const score = calculateProductScore(product, intent);

  return {
    ...product,
    score,
  };
};

export interface BudgetPickResult {
  items: RankedCandidate[];
  strategy: string;
}

export const pickCandidatesByBudget = (
  ranked: RankedCandidate[],
  budget: number | null,
  limit: number = 3
): BudgetPickResult => {
  if (ranked.length === 0) {
    return {
      items: [],
      strategy: budget ? "band_75_100" : "no_budget",
    };
  }

  const sortedByScore = [...ranked].sort(
    (a, b) => b.score - a.score || b.price - a.price || b.stock - a.stock
  );

  if (!budget) {
    return {
      items: sortedByScore.slice(0, limit),
      strategy: "no_budget",
    };
  }

  for (const band of BUDGET_BANDS) {
    const minPrice = Math.floor(budget * band.min);
    const maxPrice = Math.floor(budget * band.max);

    const inBand = sortedByScore.filter(
      item => item.price >= minPrice && item.price <= maxPrice
    );

    if (inBand.length > 0) {
      return {
        items: inBand.slice(0, limit),
        strategy: band.label,
      };
    }
  }

  const aboveBudget = sortedByScore
    .filter(item => item.price > budget)
    .sort((a, b) => a.price - b.price || b.score - a.score);

  return {
    items: aboveBudget.slice(0, limit),
    strategy: "above_budget_closest",
  };
};
