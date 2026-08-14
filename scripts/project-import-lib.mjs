import { promises as fs } from "node:fs";
import path from "node:path";

const OPTION_KEYS = ["rooms", "paintOptions", "stainTypes", "doorStyles", "countertopTypes"];

const CATEGORY_ALIASES = {
  rooms: {
    bath: "Bathroom",
    powder: "Bathroom",
    vanity: "Bathroom",
    mudroom: "Laundry",
    utility: "Laundry",
    pantry: "Kitchen",
    bar: "Other",
    office: "Other",
  },
  paintOptions: {
    cream: "off white",
    ivory: "off white",
    "warm white": "off white",
    wood: "timber",
    "wood tone": "timber",
    "natural wood": "timber",
    oak: "timber",
    walnut: "timber",
    maple: "timber",
    grey: "gray",
    charcoal: "gray",
    espresso: "brown",
    navy: "blue",
    olive: "green",
    sage: "green",
  },
  stainTypes: {
    "white glaze": "white glaze stain",
    mocha: "mocha stain",
  },
  doorStyles: {
    slab: "flat panel",
    "slab door": "flat panel",
    "flat-panel": "flat panel",
    "narrow shaker": "slim shaker",
    "thin shaker": "slim shaker",
  },
  countertopTypes: {},
};

export function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function numericUsageValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function emptyUsageTotals() {
  return {
    calls: 0,
    costUsd: 0,
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    costUnavailableCalls: 0,
  };
}

export function createOpenRouterUsageSummary() {
  return {
    total: emptyUsageTotals(),
    categories: {},
    models: {},
  };
}

function addUsageTotals(target, usage) {
  const cost = numericUsageValue(usage?.cost);
  const promptTokens = numericUsageValue(usage?.prompt_tokens) || 0;
  const completionTokens = numericUsageValue(usage?.completion_tokens) || 0;
  const reasoningTokens = numericUsageValue(usage?.completion_tokens_details?.reasoning_tokens) || 0;
  const totalTokens = numericUsageValue(usage?.total_tokens) ?? promptTokens + completionTokens;

  target.calls += 1;
  target.costUsd += cost || 0;
  target.promptTokens += promptTokens;
  target.completionTokens += completionTokens;
  target.reasoningTokens += reasoningTokens;
  target.totalTokens += totalTokens;
  if (cost === null) target.costUnavailableCalls += 1;
}

export function recordOpenRouterUsage(summary, { category = "other", model = "unknown", usage } = {}) {
  if (!summary?.total) throw new Error("OpenRouter usage summary is required");

  summary.categories[category] ||= emptyUsageTotals();
  summary.models[model] ||= emptyUsageTotals();
  addUsageTotals(summary.total, usage);
  addUsageTotals(summary.categories[category], usage);
  addUsageTotals(summary.models[model], usage);
  return summary;
}

function optionValues(items) {
  if (!Array.isArray(items)) return [];

  const values = items
    .map((item) => (typeof item === "string" ? item : item?.value))
    .map(normalizeText)
    .filter(Boolean);

  return [...new Map(values.map((value) => [value.toLowerCase(), value])).values()];
}

export async function loadCatalogOptions(projectRoot) {
  const catalogPath = path.join(projectRoot, "content", "global", "catalog-settings.json");
  const parsed = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const options = Object.fromEntries(OPTION_KEYS.map((key) => [key, optionValues(parsed[key])]));

  const emptyKeys = OPTION_KEYS.filter((key) => options[key].length === 0);
  if (emptyKeys.length) {
    throw new Error(`Catalog settings contain no values for: ${emptyKeys.join(", ")}`);
  }

  return options;
}

function findConfiguredValue(value, allowed, allowContained = true) {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const lower = normalized.toLowerCase();
  const exact = allowed.find((item) => item.toLowerCase() === lower);
  if (exact) return exact;
  if (!allowContained) return "";

  const contained = [...allowed].sort((left, right) => right.length - left.length).find((item) => {
    const candidate = item.toLowerCase();
    return lower.includes(candidate) || candidate.includes(lower);
  });

  return contained || "";
}

export function coerceCatalogValue(value, category, catalogOptions) {
  const allowed = catalogOptions[category] || [];
  const direct = findConfiguredValue(value, allowed, false);
  if (direct) return direct;

  const lower = normalizeText(value).toLowerCase();
  if (!lower) return "";

  const aliases = CATEGORY_ALIASES[category] || {};
  const aliasKey = Object.keys(aliases)
    .sort((left, right) => right.length - left.length)
    .find((key) => lower === key || lower.includes(key));
  const aliasTarget = aliasKey ? aliases[aliasKey] : "";
  if (aliasTarget) return findConfiguredValue(aliasTarget, allowed, false);

  return findConfiguredValue(value, allowed);
}

export function coerceCatalogList(values, category, catalogOptions, limit = 2) {
  const source = Array.isArray(values) ? values : [];
  const coerced = source
    .map((value) => coerceCatalogValue(value, category, catalogOptions))
    .filter(Boolean);

  return [...new Map(coerced.map((value) => [value.toLowerCase(), value])).values()].slice(0, limit);
}

function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

export function normalizeConfidence(value) {
  const fallback = typeof value === "number" ? clampUnit(value) : 0;
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return {
    room: clampUnit(source.room ?? fallback),
    cabinetPaints: clampUnit(source.cabinetPaints ?? fallback),
    cabinetStains: clampUnit(source.cabinetStains ?? fallback),
    doorStyles: clampUnit(source.doorStyles ?? fallback),
    countertop: clampUnit(source.countertop ?? fallback),
    label: clampUnit(source.label ?? fallback),
  };
}

export function normalizeVisualQuality(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return {
    composition: clampUnit(source.composition),
    sharpness: clampUnit(source.sharpness),
    lighting: clampUnit(source.lighting),
    subjectCoverage: clampUnit(source.subjectCoverage),
    obstructions: clampUnit(source.obstructions),
  };
}

export function normalizeImageAnalysis(parsed, catalogOptions) {
  const source = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};

  return {
    room: coerceCatalogValue(source.room, "rooms", catalogOptions),
    cabinetPaints: coerceCatalogList(source.cabinetPaints, "paintOptions", catalogOptions),
    cabinetStains: coerceCatalogList(source.cabinetStains, "stainTypes", catalogOptions),
    doorStyles: coerceCatalogList(source.doorStyles, "doorStyles", catalogOptions),
    countertop: coerceCatalogValue(source.countertop, "countertopTypes", catalogOptions),
    flooring: false,
    label: normalizeText(source.label),
    confidence: normalizeConfidence(source.confidence),
    visualQuality: normalizeVisualQuality(source.visualQuality),
  };
}

export function scoreCoverCandidate(item) {
  const quality = normalizeVisualQuality(item.visualQuality);
  const confidence = normalizeConfidence(item.confidence);
  const metadataCompleteness = [
    item.room,
    item.countertop,
    ...(item.cabinetPaints || []),
    ...(item.cabinetStains || []),
    ...(item.doorStyles || []),
  ].filter(Boolean).length;

  return (
    quality.composition * 30 +
    quality.sharpness * 25 +
    quality.lighting * 20 +
    quality.subjectCoverage * 20 -
    quality.obstructions * 20 +
    confidence.label * 3 +
    Math.min(metadataCompleteness, 4) * 0.5
  );
}

function assertAllowed(value, category, catalogOptions, context) {
  if (!value) return;
  if (!(catalogOptions[category] || []).includes(value)) {
    throw new Error(`${context} has unsupported ${category} value: ${value}`);
  }
}

export function validateProjectDocument(document, catalogOptions) {
  if (!document?.published) throw new Error("Project must be published");
  if (!normalizeText(document.title)) throw new Error("Project title is required");
  if (!normalizeText(document.slug)) throw new Error("Project slug is required");
  if (!normalizeText(document.description)) throw new Error("Project description is required");
  if (!normalizeText(document.primaryPicture)) throw new Error("Project primaryPicture is required");
  if (!document.sourceUpdatedAt || Number.isNaN(Date.parse(document.sourceUpdatedAt))) {
    throw new Error("Project sourceUpdatedAt must be a valid datetime");
  }

  const media = Array.isArray(document.media) ? document.media : [];
  if (!media.length) throw new Error("Project must contain media");
  if (media.filter((item) => item.roomPriority === true).length !== 1) {
    throw new Error("Project must contain exactly one roomPriority image");
  }
  const priorityImage = media.find((item) => item.roomPriority === true);
  if (priorityImage?.file !== document.primaryPicture) {
    throw new Error("Project primaryPicture must match the roomPriority image");
  }

  media.forEach((item, index) => {
    const context = `media[${index}]`;
    if (!normalizeText(item.file)) throw new Error(`${context}.file is required`);
    if (!normalizeText(item.label)) throw new Error(`${context}.label is required`);
    if (!normalizeText(item.description)) throw new Error(`${context}.description is required`);
    if (typeof item.flooring !== "boolean") throw new Error(`${context}.flooring must be boolean`);
    if (typeof item.roomPriority !== "boolean") throw new Error(`${context}.roomPriority must be boolean`);
    if (/\.(?:avif|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(item.label) || /^(?:dsc|img)\s*\d+/i.test(item.label)) {
      throw new Error(`${context}.label must not be a source filename`);
    }

    assertAllowed(item.room, "rooms", catalogOptions, context);
    assertAllowed(item.countertop, "countertopTypes", catalogOptions, context);
    for (const value of item.cabinetPaints || []) assertAllowed(value, "paintOptions", catalogOptions, context);
    for (const value of item.cabinetStains || []) assertAllowed(value, "stainTypes", catalogOptions, context);
    for (const value of item.doorStyles || []) assertAllowed(value, "doorStyles", catalogOptions, context);
  });

  return document;
}
