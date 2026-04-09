import type {
  CatalogSettingsData,
  CatalogSystemInfo,
  CatalogVisualOption,
  CountertopOverviewItem,
  CountertopsOverviewDataShape,
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

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^countertops\//i, "")
    .replace(/\s+/g, "-");
}

function toLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSystemInfo(value: unknown, fallbackFilename?: string): CatalogSystemInfo | undefined {
  const record = asRecord(value);
  if (!record && !fallbackFilename) return undefined;

  return {
    filename: asString(record?.filename) || fallbackFilename,
    basename: asString(record?.basename) || fallbackFilename?.replace(/\.md$/i, ""),
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `countertops/${fallbackFilename}` : undefined),
  };
}

export function normalizeOptionValue(value: string): string {
  return value.trim().toLowerCase();
}

const DEFAULT_DOOR_STYLE_OPTIONS: CatalogVisualOption[] = [
  { value: "shaker", label: "Shaker", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/door-style-shaker.png" },
  { value: "slim shaker", label: "Slim Shaker", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/door-style-slim-shaker.png" },
  { value: "elegant shaker", label: "Elegant Shaker", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/door-style-elegant-shaker.png" },
  { value: "flat panel", label: "Flat panel", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/door-style-flat-panel.png" },
];

const DEFAULT_PAINT_OPTIONS: CatalogVisualOption[] = [
  { value: "white", label: "White", swatchColor: "#FFFFFF" },
  { value: "off white", label: "Off white", swatchColor: "#FAF9F6" },
  { value: "timber", label: "Timber", swatchColor: "#966F33" },
  { value: "gray", label: "Gray", swatchColor: "#D6D6D6" },
  { value: "brown", label: "Brown", swatchColor: "#67564C" },
  { value: "blue", label: "Blue", swatchColor: "#47596A" },
  { value: "green", label: "Green", swatchColor: "#56716F" },
  { value: "black", label: "Black", swatchColor: "#101010" },
  { value: "custom paint", label: "Custom paint", image: "/library/catalog/paint-custom-pattern.svg" },
];

const DEFAULT_STAIN_OPTIONS: CatalogVisualOption[] = [
  { value: "white glaze stain", label: "White glaze", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/stain-white-glaze.png" },
  { value: "mocha stain", label: "Mocha", image: "" },
];

const DEFAULT_ROOMS = ["Kitchen", "Bathroom", "Laundry", "Other"];
const DEFAULT_COUNTERTOP_OPTIONS: CatalogVisualOption[] = [
  { value: "quartz", label: "Quartz", image: "/library/catalog/countertop-quartz.png" },
  { value: "granite", label: "Granite", image: "/library/catalog/countertop-granite.png" },
  { value: "marble", label: "Marble", image: "/library/catalog/countertop-marble.png" },
  { value: "quartzite", label: "Quartzite", image: "/library/catalog/countertop-quartzite.png" },
  { value: "soapstone", label: "Soapstone" },
  { value: "porcelain", label: "Porcelain" },
  { value: "butcher block", label: "Butcher Block" },
  { value: "other", label: "Other" },
];

function normalizeCatalogOption(entry: unknown): CatalogVisualOption | null {
  if (typeof entry === "string") {
    const value = normalizeOptionValue(entry);
    if (!value) return null;

    return {
      value,
      label: toLabel(value),
    };
  }

  const record = asRecord(entry);
  if (!record) return null;

  const rawValue = asString(record.value) || asString(record.label) || "";
  const value = normalizeOptionValue(rawValue);
  if (!value) return null;

  return {
    value,
    label: asString(record.label)?.trim() || toLabel(value),
    image: asString(record.image) || null,
    swatchColor: asString(record.swatchColor) || null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeCatalogOptionList(value: unknown, fallback: CatalogVisualOption[]): CatalogVisualOption[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((entry) => normalizeCatalogOption(entry))
    .filter((entry): entry is CatalogVisualOption => Boolean(entry));

  return normalized.length ? normalized : fallback;
}

function normalizeCatalogSettings(value: unknown): CatalogSettingsData {
  const record = asRecord(value);

  return {
    _sys: normalizeSystemInfo(record?._sys, "catalog-settings.json") || {
      filename: "catalog-settings.json",
      basename: "catalog-settings",
      relativePath: "catalog-settings.json",
    },
    id: asString(record?.id),
    doorStyles: normalizeCatalogOptionList(record?.doorStyles, DEFAULT_DOOR_STYLE_OPTIONS),
    paintOptions: normalizeCatalogOptionList(record?.paintOptions, DEFAULT_PAINT_OPTIONS),
    stainTypes: normalizeCatalogOptionList(record?.stainTypes, DEFAULT_STAIN_OPTIONS),
    rooms: Array.isArray(record?.rooms)
      ? record.rooms.map((entry) => String(entry).trim()).filter(Boolean)
      : DEFAULT_ROOMS,
    countertopTypes: normalizeCatalogOptionList(record?.countertopTypes, DEFAULT_COUNTERTOP_OPTIONS),
    flooringTypes: normalizeCatalogOptionList(record?.flooringTypes, []),
    _content_source: record?._content_source as unknown,
    _values: record?._values as unknown,
  };
}

function normalizeCountertop(value: unknown): CountertopOverviewItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const fallbackFilename = asString(asRecord(record._sys)?.filename);
  const fallbackSlug = fallbackFilename ? toSlug(fallbackFilename) : undefined;

  return {
    __typename: asString(record.__typename),
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    published: asBoolean(record.published) ?? null,
    name: asString(record.name) ?? null,
    code: asString(record.code) ?? null,
    slug: toSlug(asString(record.slug) || fallbackSlug || "") || null,
    countertopType: asString(record.countertopType) ?? null,
    description: asString(record.description) ?? null,
    picture: asString(record.picture) ?? null,
    sourceUpdatedAt: asDateTimeString(record.sourceUpdatedAt) ?? null,
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeCountertopsOverviewQueryData(value: unknown): CountertopsOverviewDataShape {
  const record = asRecord(value);
  const connection = asRecord(record?.countertopConnection);
  const edges = Array.isArray(connection?.edges) ? connection.edges : [];

  const normalizedEdges = edges
    .map((edge) => {
      const edgeRecord = asRecord(edge);
      const node = normalizeCountertop(edgeRecord?.node);
      if (!node || node.published !== true) return null;
      return { node };
    })
    .filter((edge): edge is { node: CountertopOverviewItem } => Boolean(edge));

  return {
    catalogSettings: normalizeCatalogSettings(record?.catalogSettings),
    countertopConnection: {
      edges: normalizedEdges,
    },
  };
}

export function getOverviewCountertopItems(data: CountertopsOverviewDataShape): CountertopOverviewItem[] {
  const edges = Array.isArray(data.countertopConnection?.edges) ? data.countertopConnection.edges : [];

  return edges
    .map((edge) => edge?.node || null)
    .filter((node): node is CountertopOverviewItem => Boolean(node));
}
