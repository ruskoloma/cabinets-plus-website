import type {
  FlooringData,
  FlooringMediaItem,
  FlooringRelatedProduct,
  FlooringSystemInfo,
  FlooringTechnicalDetail,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asDateTimeString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
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

function normalizeSystemInfo(value: unknown, fallbackFilename?: string): FlooringSystemInfo | undefined {
  const record = asRecord(value);

  if (!record && !fallbackFilename) return undefined;

  return {
    filename: asString(record?.filename) || fallbackFilename,
    basename: asString(record?.basename) || fallbackFilename?.replace(/\.md$/i, ""),
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `flooring/${fallbackFilename}` : undefined),
  };
}

function normalizeTechnicalDetail(value: unknown): FlooringTechnicalDetail | null {
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

function normalizeMediaItem(value: unknown): FlooringMediaItem | null {
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

function normalizeRelatedProduct(value: unknown): FlooringRelatedProduct | null {
  const record = asRecord(value);
  if (!record) return null;

  const product = record.product;
  if (typeof product === "string") {
    return {
      __typename: asString(record.__typename),
      product,
      _content_source: record._content_source as unknown,
    };
  }

  const productRecord = asRecord(product);
  if (!productRecord) {
    return {
      __typename: asString(record.__typename),
      product: null,
      _content_source: record._content_source as unknown,
    };
  }

  return {
    __typename: asString(record.__typename),
    product: {
      __typename: asString(productRecord.__typename),
      _sys: normalizeSystemInfo(productRecord._sys),
      id: asString(productRecord.id),
      name: asString(productRecord.name) ?? null,
      code: asString(productRecord.code) ?? null,
      slug: asString(productRecord.slug) ?? null,
      flooringType: asString(productRecord.flooringType) ?? null,
      description: asString(productRecord.description) ?? null,
      picture: asString(productRecord.picture) ?? null,
      _content_source: productRecord._content_source as unknown,
    },
    _content_source: record._content_source as unknown,
  };
}

function normalizeRawRelatedProduct(value: unknown): FlooringRelatedProduct | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    __typename: asString(record.__typename),
    product: asString(record.product) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeFlooringData(value: unknown, fallbackFilename?: string): FlooringData | null {
  const record = asRecord(value);
  if (!record) return null;
  const rawValues = asRecord(record._values);

  const typedRelatedProducts = Array.isArray(record.relatedProducts)
    ? record.relatedProducts
        .map((item) => normalizeRelatedProduct(item))
        .filter((item): item is FlooringRelatedProduct => Boolean(item))
    : [];

  const rawRelatedProducts = Array.isArray(rawValues?.relatedProducts)
    ? rawValues.relatedProducts
        .map((item) => normalizeRawRelatedProduct(item))
        .filter((item): item is FlooringRelatedProduct => Boolean(item))
    : [];

  const mergedRelatedProducts: FlooringRelatedProduct[] = [];
  const relatedProductsLength = Math.max(typedRelatedProducts.length, rawRelatedProducts.length);

  for (let index = 0; index < relatedProductsLength; index += 1) {
    const typedValue = typedRelatedProducts[index];
    const rawValue = rawRelatedProducts[index];
    const rawProduct = typeof rawValue?.product === "string" ? rawValue.product : null;

    if (!typedValue && !rawValue) continue;

    if (typedValue) {
      mergedRelatedProducts.push({
        ...(typedValue as Record<string, unknown>),
        product: typedValue.product || rawProduct,
      } as FlooringRelatedProduct);
      continue;
    }

    mergedRelatedProducts.push({
      ...(rawValue as Record<string, unknown>),
      product: rawProduct,
    } as FlooringRelatedProduct);
  }

  const typedRelatedProjects = Array.isArray(record.relatedProjects)
    ? record.relatedProjects.map((item) => normalizeProjectReference(item))
    : [];

  const rawRelatedProjects = Array.isArray(rawValues?.relatedProjects)
    ? rawValues.relatedProjects.map((item) => normalizeProjectReference(item))
    : [];

  const relatedProjects = typedRelatedProjects.length > 0 ? typedRelatedProjects : rawRelatedProjects;

  return {
    __typename: asString(record.__typename),
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    published: asBoolean(record.published) ?? null,
    name: asString(record.name) ?? null,
    code: asString(record.code) ?? null,
    slug: asString(record.slug) ?? null,
    flooringType: asString(record.flooringType) ?? null,
    description: asString(record.description) ?? null,
    picture: asString(record.picture) ?? null,
    relatedProjects,
    relatedProducts: mergedRelatedProducts,
    technicalDetails: Array.isArray(record.technicalDetails)
      ? record.technicalDetails
          .map((item) => normalizeTechnicalDetail(item))
          .filter((item): item is FlooringTechnicalDetail => Boolean(item))
      : [],
    media: Array.isArray(record.media)
      ? record.media.map((item) => normalizeMediaItem(item)).filter((item): item is FlooringMediaItem => Boolean(item))
      : [],
    sourceId: asNumber(record.sourceId) ?? null,
    sourceUpdatedAt: asDateTimeString(record.sourceUpdatedAt) ?? null,
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeFlooringQueryData(value: unknown, fallbackFilename?: string): { flooring: FlooringData | null } {
  const record = asRecord(value);
  return { flooring: normalizeFlooringData(record?.flooring, fallbackFilename) };
}
