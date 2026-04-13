export type SpecFieldType = "number" | "string" | "enum";

export interface SpecField {
  key: string;
  label: string;
  type: SpecFieldType;
  unit?: string;
  aliases?: string[];
  enumValues?: string[];
  defaultValue?: string | number;
}

export const PRODUCT_SPEC_SCHEMA: Record<string, SpecField> = {
  cpu_chip: {
    key: "cpu_chip",
    label: "CPU",
    type: "string",
    aliases: ["CPU", "Processor", "Chip", "cpu", "processor"],
  },

  gpu: {
    key: "gpu",
    label: "GPU",
    type: "string",
    aliases: ["GPU", "Graphics", "gpu", "graphics"],
  },

  ram_gb: {
    key: "ram_gb",
    label: "RAM (GB)",
    type: "number",
    unit: "GB",
    aliases: ["RAM (GB)", "RAM", "Memory", "ram", "memory"],
  },

  storage_gb: {
    key: "storage_gb",
    label: "Storage (GB)",
    type: "number",
    unit: "GB",
    aliases: ["Storage (GB)", "Storage", "ROM", "storage", "rom"],
  },

  battery_mah: {
    key: "battery_mah",
    label: "Battery (mAh)",
    type: "number",
    unit: "mAh",
    aliases: ["Battery (mAh)", "Battery", "battery"],
  },

  fast_charge_w: {
    key: "fast_charge_w",
    label: "Fast charge (W)",
    type: "number",
    unit: "W",
    aliases: ["Fast charge (W)", "Fast charge", "Charging", "fast_charge"],
  },

  rear_camera_mp: {
    key: "rear_camera_mp",
    label: "Rear camera (MP)",
    type: "number",
    unit: "MP",
    aliases: ["Rear camera (MP)", "Rear camera", "Main camera", "rear_camera"],
  },

  front_camera_mp: {
    key: "front_camera_mp",
    label: "Front camera (MP)",
    type: "number",
    unit: "MP",
    aliases: ["Front camera (MP)", "Front camera", "Selfie camera", "front_camera"],
  },

  screen_size_inch: {
    key: "screen_size_inch",
    label: "Screen size (inch)",
    type: "number",
    unit: "inch",
    aliases: ["Screen size (inch)", "Screen size", "Display size", "screen_size"],
  },

  screen_resolution: {
    key: "screen_resolution",
    label: "Screen resolution",
    type: "string",
    aliases: ["Screen resolution", "Resolution", "Display resolution", "resolution"],
  },

  refresh_rate_hz: {
    key: "refresh_rate_hz",
    label: "Refresh rate (Hz)",
    type: "number",
    unit: "Hz",
    aliases: ["Refresh rate (Hz)", "Refresh rate", "refresh_rate"],
  },
};

export interface ChipsetPattern {
  pattern: RegExp;
  score: number;
  description: string;
}

export const CHIPSET_TIER_CONFIG: ChipsetPattern[] = [
  { pattern: /snapdragon\s*(8|8\s*gen)/i, score: 25, description: "Snapdragon 8 series" },
  { pattern: /apple\s*a(1[67]|18)/i, score: 25, description: "Apple A16-A18" },
  { pattern: /dimensity\s*(9|8)/i, score: 18, description: "Dimensity 9/8 series" },
  { pattern: /exynos\s*(2|1)/i, score: 15, description: "Exynos 2/1 series" },
  { pattern: /adreno|mali|xclipse/i, score: 5, description: "GPU brands" },
];

export interface IntentPattern {
  keywords: string[];
  weight: number;
}

export const INTENT_PATTERNS = {
  phone: {
    keywords: ["dien thoai", "smartphone", "phone", "di dong"],
    weight: 1.0,
  },
  gaming: {
    keywords: [
      "hieu nang", "choi game", "gaming", "chip manh", 
      "fps", "ram", "performance", "manh me"
    ],
    weight: 1.0,
  },
  camera: {
    keywords: [
      "camera", "chup hinh", "chup anh", "quay video",
      "photography", "selfie", "zoom"
    ],
    weight: 1.0,
  },
};

export interface BudgetPattern {
  pattern: RegExp;
  multiplier: number;
  description: string;
}

export const BUDGET_PATTERNS: BudgetPattern[] = [
  { 
    pattern: /(\d+(?:[.,]\d+)?)\s*(trieu|tr|million)\b/i, 
    multiplier: 1_000_000, 
    description: "Million VND" 
  },
  { 
    pattern: /(\d+(?:[.,]\d+)?)\s*(k|nghin)\b/i, 
    multiplier: 1_000, 
    description: "Thousand VND" 
  },
  { 
    pattern: /\b(\d{7,9})\b/i, 
    multiplier: 1, 
    description: "Raw number" 
  },
];

export interface RankingWeights {
  ram: number;
  storage: number;
  refreshRate: number;
  battery: number;
  fastCharge: number;
  chipsetTier: number;
  rearCamera: number;
  frontCamera: number;
  screenSize: number;
}

export const RANKING_WEIGHTS: Record<string, RankingWeights> = {
  balanced: {
    ram: 4,
    storage: 0.04,
    refreshRate: 0.2,
    battery: 0.0015,
    fastCharge: 0.12,
    chipsetTier: 1,
    rearCamera: 1.8,
    frontCamera: 1.1,
    screenSize: 2,
  },
  gaming: {
    ram: 6,
    storage: 0.06,
    refreshRate: 0.5,
    battery: 0.002,
    fastCharge: 0.15,
    chipsetTier: 2,
    rearCamera: 0.5,
    frontCamera: 0.3,
    screenSize: 1.5,
  },
  camera: {
    ram: 2,
    storage: 0.03,
    refreshRate: 0.1,
    battery: 0.001,
    fastCharge: 0.08,
    chipsetTier: 0.5,
    rearCamera: 3,
    frontCamera: 2,
    screenSize: 2.5,
  },
};

export interface BudgetBand {
  min: number;
  max: number;
  priority: number;
  label: string;
}

export const BUDGET_BANDS: BudgetBand[] = [
  { min: 0.75, max: 1.0, priority: 1, label: "band_75_100" },
  { min: 0.5, max: 0.75, priority: 2, label: "band_50_75" },
  { min: 0, max: 0.5, priority: 3, label: "band_below_50" },
];

export const CATEGORY_PATTERNS = {
  phone: /dien thoai|phone|smartphone|di dong/i,
  laptop: /laptop|may tinh xach tay/i,
  tablet: /tablet|may tinh bang/i,
  accessory: /phu kien|accessory|case|op lung/i,
};
