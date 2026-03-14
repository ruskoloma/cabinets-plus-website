import type {
  CountertopData,
  CountertopMediaItem,
  CountertopSystemInfo,
  CountertopTechnicalDetail,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeSystemInfo(value: unknown, fallbackFilename?: string): CountertopSystemInfo | undefined {
  const record = asRecord(value);

  if (!record && !fallbackFilename) return undefined;

  return {
    filename: asString(record?.filename) || fallbackFilename,
    basename: asString(record?.basename) || fallbackFilename?.replace(/\.md$/i, ""),
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `countertops/${fallbackFilename}` : undefined),
  };
}

function normalizeTechnicalDetail(value: unknown): CountertopTechnicalDetail | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    __typename: asString(record.__typename),
    key: asString(record.key) ?? null,
    value: asString(record.value) ?? null,
    unit: asString(record.unit) ?? null,
    order: asNumber(record.order) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeMediaItem(value: unknown): CountertopMediaItem | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    __typename: asString(record.__typename),
    file: asString(record.file) ?? null,
    kind: asString(record.kind) ?? null,
    mimeType: asString(record.mimeType) ?? null,
    isPrimary: asBoolean(record.isPrimary) ?? null,
    label: asString(record.label) ?? null,
    altText: asString(record.altText) ?? null,
    description: asString(record.description) ?? null,
    sourceId: asNumber(record.sourceId) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeCountertopData(value: unknown, fallbackFilename?: string): CountertopData | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    __typename: asString(record.__typename),
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    name: asString(record.name) ?? null,
    code: asString(record.code) ?? null,
    slug: asString(record.slug) ?? null,
    countertopType: asString(record.countertopType) ?? null,
    inStock: asBoolean(record.inStock) ?? null,
    storeCollection: asString(record.storeCollection) ?? null,
    description: asString(record.description) ?? null,
    picture: asString(record.picture) ?? null,
    technicalDetails: Array.isArray(record.technicalDetails)
      ? record.technicalDetails
          .map((item) => normalizeTechnicalDetail(item))
          .filter((item): item is CountertopTechnicalDetail => Boolean(item))
      : [],
    media: Array.isArray(record.media)
      ? record.media.map((item) => normalizeMediaItem(item)).filter((item): item is CountertopMediaItem => Boolean(item))
      : [],
    sourceId: asNumber(record.sourceId) ?? null,
    sourceUpdatedAt: asString(record.sourceUpdatedAt) ?? null,
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeCountertopQueryData(value: unknown, fallbackFilename?: string): { countertop: CountertopData | null } {
  const record = asRecord(value);
  return { countertop: normalizeCountertopData(record?.countertop, fallbackFilename) };
}
