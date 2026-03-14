import type {
  ProjectDetailQueryLikeResult,
  ProjectMediaItem,
  ProjectOverviewItem,
} from "@/components/project-detail/types";

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
    primaryPicture: asString(record.primaryPicture) ?? null,
    relatedProjects: Array.isArray(record.relatedProjects)
      ? record.relatedProjects.map((item) => (typeof item === "string" ? item : null))
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
