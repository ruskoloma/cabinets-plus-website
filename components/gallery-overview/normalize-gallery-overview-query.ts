import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import type {
  CatalogSettingsData,
  CatalogSystemInfo,
  CatalogVisualOption,
  GalleryProjectMediaData,
  GalleryProjectItemData,
  GalleryOverviewDataShape,
  ProjectMediaItem,
  ProjectOverviewItem,
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

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
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
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `projects/${fallbackFilename}` : undefined),
  };
}

const DEFAULT_DOOR_STYLE_OPTIONS: CatalogVisualOption[] = [
  {
    value: "shaker",
    label: "Shaker",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/shaker.png",
  },
  {
    value: "slim shaker",
    label: "Slim Shaker",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/slim-shaker.png",
  },
  {
    value: "elegant shaker",
    label: "Elegant Shaker",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/elegant-shaker.png",
  },
  {
    value: "flat panel",
    label: "Flat panel",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/flat-panel.png",
  },
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
  { value: "custom paint", label: "Custom paint", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/custom-paint.png" },
];

const DEFAULT_STAIN_OPTIONS: CatalogVisualOption[] = [
  {
    value: "white glaze stain",
    label: "White glaze",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/white-glaze-w-bg.png",
  },
  {
    value: "mocha stain",
    label: "Mocha",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/catalog/mocha-w-bg.png",
  },
];

const DEFAULT_ROOMS = ["Kitchen", "Bathroom", "Laundry", "Other"];
const DEFAULT_COUNTERTOP_OPTIONS: CatalogVisualOption[] = [
  { value: "quartz", label: "Quartz", image: "/library/catalog/countertop-quartz.png" },
  { value: "granite", label: "Granite", image: "/library/catalog/countertop-granite.png" },
  { value: "marble", label: "Marble", image: "/library/catalog/countertop-marble.png" },
  { value: "quartzite", label: "Quartzite", image: "/library/catalog/countertop-quartzite.png" },
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

function normalizeProjectMedia(value: unknown): ProjectMediaItem | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    file: asString(record.file) ?? null,
    roomPriority: asBoolean(record.roomPriority) ?? null,
    paintPriority: asBoolean(record.paintPriority) ?? null,
    stainPriority: asBoolean(record.stainPriority) ?? null,
    countertopPriority: asBoolean(record.countertopPriority) ?? null,
    flooring: asBoolean(record.flooring) ?? null,
    room: asString(record.room) ?? null,
    cabinetPaints: Array.isArray(record.cabinetPaints)
      ? record.cabinetPaints.map((entry) => (typeof entry === "string" ? entry : null))
      : null,
    cabinetStains: Array.isArray(record.cabinetStains)
      ? record.cabinetStains.map((entry) => (typeof entry === "string" ? entry : null))
      : null,
    countertop: asString(record.countertop) ?? null,
    label: asString(record.label) ?? null,
    description: asString(record.description) ?? null,
    raw: record,
  };
}

function normalizeProject(value: unknown): ProjectOverviewItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const fallbackFilename = asString(asRecord(record._sys)?.filename);
  const media = Array.isArray(record.media)
    ? record.media.map((entry) => normalizeProjectMedia(entry)).filter((entry): entry is ProjectMediaItem => Boolean(entry))
    : [];

  return {
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    published: asBoolean(record.published) ?? null,
    title: asString(record.title) ?? null,
    slug: toSlug(asString(record.slug) || fallbackFilename || ""),
    address: asString(record.address) ?? null,
    description: asString(record.description) ?? null,
    notes: asString(record.notes) ?? null,
    primaryPicture: null,
    sourceUpdatedAt: asString(record.sourceUpdatedAt) ?? null,
    media,
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeGalleryOverviewQueryData(value: unknown): GalleryOverviewDataShape {
  const record = asRecord(value);
  const connection = asRecord(record?.projectConnection);
  const edges = Array.isArray(connection?.edges) ? connection.edges : [];

  const normalizedEdges = edges
    .map((edge) => {
      const edgeRecord = asRecord(edge);
      const node = normalizeProject(edgeRecord?.node);
      if (!node) return null;
      return { node };
    })
    .filter((edge): edge is { node: ProjectOverviewItem } => Boolean(edge));

  return {
    catalogSettings: normalizeCatalogSettings(record?.catalogSettings),
    projectConnection: {
      edges: normalizedEdges,
    },
  };
}

export function getOverviewProjectItems(data: GalleryOverviewDataShape): ProjectOverviewItem[] {
  const edges = Array.isArray(data.projectConnection?.edges) ? data.projectConnection.edges : [];

  return edges
    .map((edge) => edge?.node || null)
    .filter((node): node is ProjectOverviewItem => Boolean(node));
}

function cleanList(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => normalizeOptionValue(value || ""))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function inferDoorStyleFromText(content: string, availableValues: string[]): string {
  const normalized = normalizeOptionValue(content);
  if (!normalized) return "";

  const preferredMatches = [...availableValues].sort((left, right) => right.length - left.length);
  for (const value of preferredMatches) {
    if (value && normalized.includes(value)) return value;
  }

  if (normalized.includes("slab")) return "flat panel";
  if (normalized.includes("flat panel") || normalized.includes("flat-front") || normalized.includes("flat front")) {
    return "flat panel";
  }
  if (normalized.includes("slim shaker")) return "slim shaker";
  if (normalized.includes("elegant shaker")) return "elegant shaker";
  if (normalized.includes("shaker")) return "shaker";

  return "";
}

export function buildGalleryProjects(data: GalleryOverviewDataShape): GalleryProjectItemData[] {
  const doorStyleValues = (data.catalogSettings?.doorStyles || []).map((option) => normalizeOptionValue(option.value));
  return getOverviewProjectItems(data)
    .map((project) => {
      const rawProject = project as unknown as Record<string, unknown>;
      const projectSlug = toSlug(project.slug || project._sys?.filename || "");
      const projectTitle = (project.title || (projectSlug ? toLabel(projectSlug) : "Project")).trim();
      const updatedAt = project.sourceUpdatedAt ? Date.parse(project.sourceUpdatedAt) : Number.NaN;
      const mediaItems = (project.media || []).filter((item): item is ProjectMediaItem => Boolean(item && item.file));
      const normalizedMedia: GalleryProjectMediaData[] = mediaItems.map((media, index) => ({
        rawMedia: media.raw || {},
        file: (media.file || "").trim(),
        room: normalizeOptionValue(media.room || ""),
        paints: cleanList(media.cabinetPaints || []),
        stains: cleanList(media.cabinetStains || []),
        finishes: cleanList([...(media.cabinetPaints || []), ...(media.cabinetStains || [])]),
        countertop: normalizeOptionValue(media.countertop || ""),
        flooring: Boolean(media.flooring),
        roomPriority: Boolean(media.roomPriority),
        paintPriority: Boolean(media.paintPriority),
        stainPriority: Boolean(media.stainPriority),
        countertopPriority: Boolean(media.countertopPriority),
        label: (media.label || "").trim(),
        description: (media.description || "").trim(),
        order: index,
      }));
      const coverImage = (mediaItems[0]?.file || "").trim();
      const searchableText = [
        projectTitle,
        project.description || "",
        project.notes || "",
        ...mediaItems.map((media) => media.label || ""),
        ...mediaItems.map((media) => media.description || ""),
      ].join(" ");

      return {
        rawProject,
        projectSlug,
        projectTitle,
        coverImage,
        media: normalizedMedia,
        rooms: cleanList(normalizedMedia.map((media) => media.room)),
        paints: cleanList(normalizedMedia.flatMap((media) => media.paints)),
        stains: cleanList(normalizedMedia.flatMap((media) => media.stains)),
        countertops: cleanList(normalizedMedia.map((media) => media.countertop)),
        flooring: normalizedMedia.some((media) => media.flooring),
        doorStyle: inferDoorStyleFromText(searchableText, doorStyleValues),
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
      };
    })
    .filter((project) => project.projectSlug.length > 0 && project.coverImage.length > 0)
    .sort((left, right) => {
      if (right.updatedAt !== left.updatedAt) return right.updatedAt - left.updatedAt;
      return left.projectTitle.localeCompare(right.projectTitle);
    });
}
