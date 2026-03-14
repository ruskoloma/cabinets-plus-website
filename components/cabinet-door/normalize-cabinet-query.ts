import type {
  CabinetData,
  CabinetMediaItem,
  CabinetRelatedProduct,
  CabinetSystemInfo,
  CabinetTechnicalDetail,
} from "@/components/cabinet-door/types";

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

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeSystemInfo(value: unknown, fallbackFilename?: string): CabinetSystemInfo | undefined {
  const record = asRecord(value);

  if (!record && !fallbackFilename) return undefined;

  return {
    filename: asString(record?.filename) || fallbackFilename,
    basename: asString(record?.basename) || fallbackFilename?.replace(/\.md$/i, ""),
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `cabinets/${fallbackFilename}` : undefined),
  };
}

function normalizeTechnicalDetail(value: unknown): CabinetTechnicalDetail | null {
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

function normalizeMediaItem(value: unknown): CabinetMediaItem | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    __typename: asString(record.__typename),
    file: asString(record.file) ?? null,
    roomPriority: asBoolean(record.roomPriority) ?? null,
    paintPriority: asBoolean(record.paintPriority) ?? null,
    stainPriority: asBoolean(record.stainPriority) ?? null,
    countertopPriority: asBoolean(record.countertopPriority) ?? null,
    flooring: asBoolean(record.flooring) ?? null,
    room: asString(record.room) ?? null,
    cabinetPaints: (() => {
      const values = asStringList(record.cabinetPaints);
      if (values.length > 0) return values;
      const legacy = asString(record.paint);
      return legacy ? [legacy] : [];
    })(),
    cabinetStains: (() => {
      const values = asStringList(record.cabinetStains);
      if (values.length > 0) return values;
      const legacy = asString(record.stain);
      return legacy ? [legacy] : [];
    })(),
    countertop: asString(record.countertop) ?? null,
    label: asString(record.label) ?? null,
    description: asString(record.description) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeRelatedProduct(value: unknown): CabinetRelatedProduct | null {
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
      doorStyle: asString(productRecord.doorStyle) ?? null,
      paint: asString(productRecord.paint) ?? null,
      stainType: asString(productRecord.stainType) ?? null,
      description: asString(productRecord.description) ?? null,
      picture: asString(productRecord.picture) ?? null,
      _content_source: productRecord._content_source as unknown,
    },
    _content_source: record._content_source as unknown,
  };
}

function normalizeRawRelatedProduct(value: unknown): CabinetRelatedProduct | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    __typename: asString(record.__typename),
    product: asString(record.product) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeCabinetData(value: unknown, fallbackFilename?: string): CabinetData | null {
  const record = asRecord(value);
  if (!record) return null;
  const rawValues = asRecord(record._values);

  const typedRelatedProducts = Array.isArray(record.relatedProducts)
    ? record.relatedProducts.map((item) => normalizeRelatedProduct(item)).filter((item): item is CabinetRelatedProduct => Boolean(item))
    : [];

  const rawRelatedProducts = Array.isArray(rawValues?.relatedProducts)
    ? rawValues.relatedProducts
        .map((item) => normalizeRawRelatedProduct(item))
        .filter((item): item is CabinetRelatedProduct => Boolean(item))
    : [];

  const mergedRelatedProducts: CabinetRelatedProduct[] = [];
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
      } as CabinetRelatedProduct);
      continue;
    }

    mergedRelatedProducts.push({
      ...(rawValue as Record<string, unknown>),
      product: rawProduct,
    } as CabinetRelatedProduct);
  }

  const typedRelatedProjects = Array.isArray(record.relatedProjects)
    ? record.relatedProjects.map((item) => (typeof item === "string" ? item : null))
    : [];

  const rawRelatedProjects = Array.isArray(rawValues?.relatedProjects)
    ? rawValues.relatedProjects.map((item) => (typeof item === "string" ? item : null))
    : [];

  const relatedProjects = typedRelatedProjects.length > 0 ? typedRelatedProjects : rawRelatedProjects;

  return {
    __typename: asString(record.__typename),
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    name: asString(record.name) ?? null,
    code: asString(record.code) ?? null,
    slug: asString(record.slug) ?? null,
    doorStyle: asString(record.doorStyle) ?? null,
    paint: asString(record.paint) ?? null,
    stainType: asString(record.stainType) ?? null,
    description: asString(record.description) ?? null,
    picture: asString(record.picture) ?? null,
    relatedProjects,
    relatedProducts: mergedRelatedProducts,
    technicalDetails: Array.isArray(record.technicalDetails)
      ? record.technicalDetails
          .map((item) => normalizeTechnicalDetail(item))
          .filter((item): item is CabinetTechnicalDetail => Boolean(item))
      : [],
    media: Array.isArray(record.media)
      ? record.media.map((item) => normalizeMediaItem(item)).filter((item): item is CabinetMediaItem => Boolean(item))
      : [],
    sourceId: asNumber(record.sourceId) ?? null,
    sourceUpdatedAt: asString(record.sourceUpdatedAt) ?? null,
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeCabinetQueryData(value: unknown, fallbackFilename?: string): { cabinet: CabinetData | null } {
  const record = asRecord(value);
  return { cabinet: normalizeCabinetData(record?.cabinet, fallbackFilename) };
}
