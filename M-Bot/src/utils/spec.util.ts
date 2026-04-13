import { PRODUCT_SPEC_SCHEMA, type SpecField } from "../config/product.config";

export const parseSpecNumber = (
  value: unknown,
  fallback: number = 0
): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, ".").trim();
    const match = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

export const findSpecFieldKey = (inputKey: string): string | null => {
  const normalized = inputKey.toLowerCase().trim();

  for (const [standardKey, field] of Object.entries(PRODUCT_SPEC_SCHEMA)) {
    if (field.key.toLowerCase() === normalized) {
      return standardKey;
    }

    if (field.label.toLowerCase() === normalized) {
      return standardKey;
    }

    if (field.aliases?.some(alias => alias.toLowerCase() === normalized)) {
      return standardKey;
    }
  }

  return null;
};

export const normalizeSpecValue = (
  field: SpecField,
  value: unknown
): string | number => {
  if (field.type === "number") {
    return parseSpecNumber(value, field.defaultValue as number || 0);
  }

  if (field.type === "string") {
    if (typeof value === "string") {
      return value.trim() || (field.defaultValue as string || "");
    }
    return String(value || field.defaultValue || "");
  }

  if (field.type === "enum") {
    const strValue = String(value || "").trim();
    if (field.enumValues?.includes(strValue)) {
      return strValue;
    }
    return field.defaultValue as string || "";
  }

  return value as string | number;
};

export const normalizeSpecifications = (
  rawSpecs: Record<string, unknown>
): Record<string, string | number> => {
  const normalized: Record<string, string | number> = {};

  for (const [rawKey, rawValue] of Object.entries(rawSpecs)) {
    const standardKey = findSpecFieldKey(rawKey);

    if (!standardKey) {
      if (typeof rawValue === "string" || typeof rawValue === "number") {
        normalized[rawKey] = rawValue;
      }
      continue;
    }

    const field = PRODUCT_SPEC_SCHEMA[standardKey];
    const normalizedValue = normalizeSpecValue(field, rawValue);

    normalized[field.label] = normalizedValue;
  }

  return normalized;
};

export const extractSpecsFromRawProduct = (
  raw: Record<string, unknown>
): Record<string, string | number> => {
  const specs: Record<string, string | number> = {};

  for (const [standardKey, field] of Object.entries(PRODUCT_SPEC_SCHEMA)) {
    const rawValue = raw[field.key] || raw[standardKey];

    if (rawValue !== undefined && rawValue !== null) {
      const normalizedValue = normalizeSpecValue(field, rawValue);
      specs[field.label] = normalizedValue;
    }
  }

  return specs;
};

export const getSpecValue = (
  specs: Record<string, string | number>,
  keys: string[],
  fallback: number = 0
): number => {
  for (const key of keys) {
    const standardKey = findSpecFieldKey(key);

    if (standardKey) {
      const field = PRODUCT_SPEC_SCHEMA[standardKey];
      const value = specs[field.label];

      if (value !== undefined) {
        return parseSpecNumber(value, fallback);
      }
    }

    const directValue = specs[key];
    if (directValue !== undefined) {
      return parseSpecNumber(directValue, fallback);
    }
  }

  return fallback;
};

export const validateSpecifications = (
  specs: Record<string, string | number>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(specs)) {
    const standardKey = findSpecFieldKey(key);

    if (!standardKey) {
      continue;
    }

    const field = PRODUCT_SPEC_SCHEMA[standardKey];

    if (field.type === "number") {
      const numValue = parseSpecNumber(value);
      if (!Number.isFinite(numValue) || numValue < 0) {
        errors.push(`Invalid number value for ${field.label}: ${value}`);
      }
    }

    if (field.type === "enum" && field.enumValues) {
      const strValue = String(value);
      if (!field.enumValues.includes(strValue)) {
        errors.push(
          `Invalid enum value for ${field.label}: ${value}. Expected one of: ${field.enumValues.join(", ")}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
