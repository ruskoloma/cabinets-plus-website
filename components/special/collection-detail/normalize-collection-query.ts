import type {
  CollectionDetailQueryLikeResult,
  CollectionMediaSummary,
  CollectionOverviewItem,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeProjectReference(value: unknown): string | null {
  if (typeof value === "string") return value;

  const record = asRecord(value);
  if (!record) return null;

  if ("project" in record) {
    return normalizeProjectReference(record.project);
  }

  return (
    asString(record.slug) ||
    asString(asRecord(record._sys)?.relativePath) ||
    asString(asRecord(record._sys)?.filename) ||
    null
  );
}

function normalizeSystemInfo(value: unknown, fallbackFilename?: string) {
  const record = asRecord(value);
  if (!record && !fallbackFilename) return undefined;

  return {
    filename: asString(record?.filename) || fallbackFilename,
    basename: asString(record?.basename) || fallbackFilename?.replace(/\.md$/i, ""),
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `collections/${fallbackFilename}` : undefined),
  };
}

function toCollectionSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^collections\//i, "")
    .replace(/\s+/g, "-");
}

function normalizeCollectionMedia(value: unknown): CollectionMediaSummary | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    file: asString(record.file) ?? null,
    label: asString(record.label) ?? null,
    description: asString(record.description) ?? null,
    raw: record,
  };
}

function normalizeCollection(value: unknown, fallbackFilename?: string): CollectionOverviewItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const media = Array.isArray(record.media)
    ? record.media
        .map((item) => normalizeCollectionMedia(item))
        .filter((item): item is CollectionMediaSummary => Boolean(item))
    : [];

  const normalizedSlug = toCollectionSlug(
    asString(record.slug) || asString(asRecord(record._sys)?.filename) || fallbackFilename || "",
  );

  return {
    __typename: asString(record.__typename),
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    published: asBoolean(record.published) ?? null,
    title: asString(record.title) ?? null,
    slug: normalizedSlug || null,
    description: asString(record.description) ?? null,
    coverImage: asString(record.coverImage) ?? null,
    sourceUpdatedAt: asString(record.sourceUpdatedAt) ?? null,
    media,
    relatedProjects: (() => {
      const typedRelated = Array.isArray(record.relatedProjects)
        ? record.relatedProjects.map((item) => normalizeProjectReference(item))
        : [];
      const rawRelated = Array.isArray(asRecord(record._values)?.relatedProjects)
        ? (asRecord(record._values)?.relatedProjects as unknown[]).map((item) => normalizeProjectReference(item))
        : [];
      return typedRelated.length > 0 ? typedRelated : rawRelated;
    })(),
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeCollectionQueryData(value: unknown, fallbackFilename?: string): CollectionDetailQueryLikeResult["data"] {
  const record = asRecord(value);
  return {
    collection: normalizeCollection(record?.collection, fallbackFilename),
  };
}
