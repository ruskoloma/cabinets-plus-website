import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import { buildGalleryProjects } from "@/components/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewDataShape } from "@/components/gallery-overview/types";
import type {
  CabinetListItem,
  CatalogSettingsData,
  CountertopListItem,
  ProjectFeatureSummary,
  ProjectGalleryItem,
  ProjectMaterialCardData,
  ProjectOverviewItem,
  ProjectRelatedCardData,
} from "./types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
    .replace(/\s+/g, "-");
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanList(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => normalizeOptionValue(value || ""))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function humanizeFileName(file: string): string {
  const trimmed = file.split("?")[0].split("/").pop() || file;
  return titleCase(trimmed.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
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

function getProjectSearchableText(project: ProjectOverviewItem): string {
  const media = Array.isArray(project.media) ? project.media : [];

  return [
    project.title || "",
    project.description || "",
    project.notes || "",
    ...media.map((item) => item?.label || ""),
    ...media.map((item) => item?.description || ""),
  ].join(" ");
}

function getFeatureSummary(project: ProjectOverviewItem, catalogSettings?: CatalogSettingsData | null): ProjectFeatureSummary {
  const mediaItems = (project.media || []).filter((item) => Boolean(item && item.file));
  const searchableText = getProjectSearchableText(project);
  const doorStyleValues = (catalogSettings?.doorStyles || []).map((option) => normalizeOptionValue(option.value));

  return {
    rooms: cleanList(mediaItems.map((item) => item?.room)),
    paints: cleanList(mediaItems.flatMap((item) => item?.cabinetPaints || [])),
    stains: cleanList(mediaItems.flatMap((item) => item?.cabinetStains || [])),
    countertops: cleanList(mediaItems.map((item) => item?.countertop)),
    flooring: mediaItems.some((item) => Boolean(item?.flooring)),
    doorStyle: inferDoorStyleFromText(searchableText, doorStyleValues),
  };
}

function toCollectionSlug(value: string, collectionName: "cabinets" | "countertops"): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(new RegExp(`^${collectionName}/`, "i"), "")
    .replace(/^\/+/, "")
    .split("/")
    .pop()
    ?.replace(/\s+/g, "-") || "";
}

function formatProductCode(code?: string | null): string | undefined {
  if (!code?.trim()) return undefined;
  return `#${code.replace(/^#+/, "").trim()}`;
}

function resolveReferencedProductSlug(
  value: string | { slug?: string | null; _sys?: { filename?: string; relativePath?: string } | null } | null | undefined,
  collectionName: "cabinets" | "countertops",
): string {
  if (!value) return "";
  if (typeof value === "string") return toCollectionSlug(value, collectionName);

  return toCollectionSlug(
    value.slug || value._sys?.relativePath || value._sys?.filename || "",
    collectionName,
  );
}

function resolveReferencedProductCard<
  T extends { slug: string; name: string; code: string; picture: string }
>(
  value:
    | string
    | {
        slug?: string | null;
        _sys?: { filename?: string; relativePath?: string } | null;
        name?: string | null;
        code?: string | null;
        picture?: string | null;
      }
    | null
    | undefined,
  collectionName: "cabinets" | "countertops",
  indexBySlug: Map<string, T>,
): { slug: string; title: string; subtitle?: string; image?: string } | null {
  const slug = resolveReferencedProductSlug(value, collectionName);
  if (!slug) return null;

  const fallback = indexBySlug.get(slug);
  const objectValue = value && typeof value === "object" ? value : null;
  const title = objectValue?.name?.trim() || fallback?.name || titleCase(slug);
  const subtitle = formatProductCode(objectValue?.code || fallback?.code);
  const image = objectValue?.picture?.trim() || fallback?.picture || undefined;

  return {
    slug,
    title,
    subtitle,
    image,
  };
}

export function buildProjectGallery(project: ProjectOverviewItem): ProjectGalleryItem[] {
  const items: ProjectGalleryItem[] = [];
  const seen = new Set<string>();
  const title = project.title?.trim() || "Project";

  const primaryPicture = (project.primaryPicture || "").trim();
  if (primaryPicture && !seen.has(primaryPicture)) {
    seen.add(primaryPicture);
    items.push({
      file: primaryPicture,
      alt: title,
      sourceType: "primaryPicture",
    });
  }

  for (const media of project.media || []) {
    const file = (media?.file || "").trim();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    items.push({
      file,
      alt: media?.label?.trim() || title,
      sourceType: "media",
      source: media || undefined,
    });
  }

  return items;
}

export function buildMaterialCards(
  project: ProjectOverviewItem,
  cabinetIndex: CabinetListItem[],
  countertopIndex: CountertopListItem[],
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): ProjectMaterialCardData[] {
  const cards: ProjectMaterialCardData[] = [];
  const rawProject = project as unknown as Record<string, unknown>;
  const cabinetIndexBySlug = new Map(cabinetIndex.map((item) => [item.slug, item]));
  const countertopIndexBySlug = new Map(countertopIndex.map((item) => [item.slug, item]));

  (project.cabinetProducts || []).forEach((item, index) => {
    const linked = resolveReferencedProductCard(item?.cabinet, "cabinets", cabinetIndexBySlug);
    if (!linked) return;

    cards.push({
      kind: "cabinet",
      label: "Cabinet door",
      title: linked.title,
      subtitle: linked.subtitle,
      image: linked.image,
      href: `/cabinets/${linked.slug}`,
      tinaField: tinaFieldFn(rawProject, `cabinetProducts.${index}.cabinet`) || undefined,
    });
  });

  (project.countertopProducts || []).forEach((item, index) => {
    const linked = resolveReferencedProductCard(item?.countertop, "countertops", countertopIndexBySlug);
    if (!linked) return;

    cards.push({
      kind: "countertop",
      label: "Countertop",
      title: linked.title,
      subtitle: linked.subtitle,
      image: linked.image,
      href: `/countertops/${linked.slug}`,
      tinaField: tinaFieldFn(rawProject, `countertopProducts.${index}.countertop`) || undefined,
    });
  });

  return cards;
}

function buildSimilarityScore(current: ProjectFeatureSummary, candidate: ProjectFeatureSummary): number {
  let score = 0;

  for (const room of candidate.rooms) {
    if (current.rooms.includes(room)) score += 2;
  }
  for (const paint of candidate.paints) {
    if (current.paints.includes(paint)) score += 2;
  }
  for (const stain of candidate.stains) {
    if (current.stains.includes(stain)) score += 2;
  }
  for (const countertop of candidate.countertops) {
    if (current.countertops.includes(countertop)) score += 2;
  }
  if (candidate.flooring && current.flooring) score += 1;
  if (candidate.doorStyle && candidate.doorStyle === current.doorStyle) score += 2;

  return score;
}

export function buildRelatedProjectCards(
  project: ProjectOverviewItem,
  overviewData: GalleryOverviewDataShape,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
  limit = 3,
): ProjectRelatedCardData[] {
  const currentSlug = toSlug(project.slug || project._sys?.filename || project.title || "");
  const projectCards = buildGalleryProjects(overviewData);
  const projectMap = new Map(projectCards.map((item) => [item.projectSlug, item]));
  const results: ProjectRelatedCardData[] = [];
  const used = new Set<string>();
  const rawProject = project as unknown as Record<string, unknown>;
  const currentSummary = getFeatureSummary(project, overviewData.catalogSettings);

  (project.relatedProjects || []).forEach((value, index) => {
    const slug = toSlug(value || "");
    const match = projectMap.get(slug);
    if (!slug || !match || used.has(slug) || slug === currentSlug) return;

    used.add(slug);
    results.push({
      slug,
      title: match.projectTitle,
      image: match.coverImage,
      tinaField: tinaFieldFn(rawProject, `relatedProjects.${index}.project`) || undefined,
    });
  });

  if (results.length >= limit) return results.slice(0, limit);

  const candidates = projectCards
    .filter((item) => item.projectSlug !== currentSlug && !used.has(item.projectSlug))
    .map((item) => ({
      item,
      score: buildSimilarityScore(currentSummary, {
        rooms: item.rooms,
        paints: item.paints,
        stains: item.stains,
        countertops: item.countertops,
        flooring: item.flooring,
        doorStyle: item.doorStyle,
      }),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.item.projectTitle.localeCompare(right.item.projectTitle);
    });

  for (const { item } of candidates) {
    if (results.length >= limit) break;
    used.add(item.projectSlug);
    results.push({
      slug: item.projectSlug,
      title: item.projectTitle,
      image: item.coverImage,
    });
  }

  return results.slice(0, limit);
}

export function getProjectSlug(project: ProjectOverviewItem, fallbackSlug: string): string {
  return toSlug(project.slug || project._sys?.filename || fallbackSlug);
}

export function getProjectHeading(project: ProjectOverviewItem, fallbackSlug: string): string {
  return project.title?.trim() || titleCase(getProjectSlug(project, fallbackSlug));
}

export function getProjectDescription(project: ProjectOverviewItem): string {
  return project.description?.trim() || "";
}

export function getProjectPrimaryField(
  project: ProjectOverviewItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  const rawProject = project as unknown as Record<string, unknown>;
  return tinaFieldFn(rawProject, "primaryPicture") || undefined;
}

export function getProjectGalleryField(
  project: ProjectOverviewItem,
  item: ProjectGalleryItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  if (item.sourceType === "primaryPicture") return getProjectPrimaryField(project, tinaFieldFn);
  if (!item.source?.raw) return undefined;
  return tinaFieldFn(item.source.raw as Record<string, unknown>, "file") || undefined;
}

export function getProjectGalleryAlt(project: ProjectOverviewItem, item: ProjectGalleryItem): string {
  if (item.alt.trim()) return item.alt.trim();
  return humanizeFileName(item.file);
}
