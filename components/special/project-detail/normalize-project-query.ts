import type {
  ProjectCabinetProductLink,
  ProjectCountertopProductLink,
  ProjectFlooringProductLink,
  ProjectDetailQueryLikeResult,
  ProjectMediaItem,
  ProjectOverviewItem,
} from "@/components/special/project-detail/types";

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
    relativePath: asString(record?.relativePath) || (fallbackFilename ? `projects/${fallbackFilename}` : undefined),
  };
}

function toProjectSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
    .replace(/\s+/g, "-");
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

function normalizeReferencedProduct(value: unknown) {
  const record = asRecord(value);
  if (!record) return null;

  return {
    _sys: normalizeSystemInfo(record._sys),
    id: asString(record.id),
    name: asString(record.name) ?? null,
    code: asString(record.code) ?? null,
    slug: asString(record.slug) ?? null,
    picture: asString(record.picture) ?? null,
  };
}

function normalizeProjectCabinetProduct(value: unknown): ProjectCabinetProductLink | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    cabinet:
      typeof record.cabinet === "string"
        ? record.cabinet
        : normalizeReferencedProduct(record.cabinet),
    customName: asString(record.customName) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeProjectCountertopProduct(value: unknown): ProjectCountertopProductLink | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    countertop:
      typeof record.countertop === "string"
        ? record.countertop
        : normalizeReferencedProduct(record.countertop),
    customName: asString(record.customName) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeProjectFlooringProduct(value: unknown): ProjectFlooringProductLink | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    flooring:
      typeof record.flooring === "string"
        ? record.flooring
        : normalizeReferencedProduct(record.flooring),
    customName: asString(record.customName) ?? null,
    _content_source: record._content_source as unknown,
  };
}

function normalizeProject(value: unknown, fallbackFilename?: string): ProjectOverviewItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const media = Array.isArray(record.media)
    ? record.media
        .map((item) => normalizeProjectMedia(item))
        .filter((item): item is ProjectMediaItem => Boolean(item))
    : [];

  const normalizedSlug = toProjectSlug(
    asString(record.slug) || asString(asRecord(record._sys)?.filename) || fallbackFilename || "",
  );

  return {
    __typename: asString(record.__typename),
    _sys: normalizeSystemInfo(record._sys, fallbackFilename),
    id: asString(record.id),
    title: asString(record.title) ?? null,
    slug: normalizedSlug || null,
    address: asString(record.address) ?? null,
    description: asString(record.description) ?? null,
    notes: asString(record.notes) ?? null,
    primaryPicture: null,
    relatedProjects: (() => {
      const typedRelatedProjects = Array.isArray(record.relatedProjects)
        ? record.relatedProjects.map((item) => normalizeProjectReference(item))
        : [];
      const rawRelatedProjects = Array.isArray(asRecord(record._values)?.relatedProjects)
        ? (asRecord(record._values)?.relatedProjects as unknown[]).map((item) => normalizeProjectReference(item))
        : [];

      return typedRelatedProjects.length > 0 ? typedRelatedProjects : rawRelatedProjects;
    })(),
    cabinetProducts: Array.isArray(record.cabinetProducts)
      ? record.cabinetProducts
          .map((item) => normalizeProjectCabinetProduct(item))
          .filter((item): item is ProjectCabinetProductLink => Boolean(item))
      : [],
    countertopProducts: Array.isArray(record.countertopProducts)
      ? record.countertopProducts
          .map((item) => normalizeProjectCountertopProduct(item))
          .filter((item): item is ProjectCountertopProductLink => Boolean(item))
      : [],
    flooringProducts: Array.isArray(record.flooringProducts)
      ? record.flooringProducts
          .map((item) => normalizeProjectFlooringProduct(item))
          .filter((item): item is ProjectFlooringProductLink => Boolean(item))
      : [],
    media,
    sourceUpdatedAt: asString(record.sourceUpdatedAt) ?? null,
    _content_source: record._content_source as unknown,
    _values: record._values as unknown,
  };
}

export function normalizeProjectQueryData(value: unknown, fallbackFilename?: string): ProjectDetailQueryLikeResult["data"] {
  const record = asRecord(value);
  return {
    project: normalizeProject(record?.project, fallbackFilename),
  };
}
