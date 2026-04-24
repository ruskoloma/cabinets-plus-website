import { buildGalleryProjects } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewDataShape } from "@/components/special/gallery-overview/types";
import {
  getCabinetReferenceFocusItemId,
  getCountertopReferenceFocusItemId,
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
  TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
  TINA_LIST_KEY_PROJECT_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import type {
  CabinetListItem,
  CountertopListItem,
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

function humanizeFileName(file: string): string {
  const trimmed = file.split("?")[0].split("/").pop() || file;
  return titleCase(trimmed.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
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

function resolveReferencedProjectSlug(
  value: string | { slug?: string | null; _sys?: { filename?: string; relativePath?: string } | null } | null | undefined,
): string {
  if (!value) return "";
  if (typeof value === "string") return toSlug(value);

  return toSlug(
    value.slug || value._sys?.relativePath || value._sys?.filename || "",
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
  const title = getProjectDisplayTitle(project);

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
      focusItemId: getCabinetReferenceFocusItemId(item?.cabinet),
      focusListKey: TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
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
      focusItemId: getCountertopReferenceFocusItemId(item?.countertop),
      focusListKey: TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
      tinaField: tinaFieldFn(rawProject, `countertopProducts.${index}.countertop`) || undefined,
    });
  });

  return cards;
}

export function buildRelatedProjectCards(
  project: ProjectOverviewItem,
  overviewData: GalleryOverviewDataShape,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
  limit = 3,
): ProjectRelatedCardData[] {
  const currentSlug = toSlug(project.slug || project._sys?.filename || "");
  const projectCards = buildGalleryProjects(overviewData);
  const projectMap = new Map(projectCards.map((item) => [item.projectSlug, item]));
  const results: ProjectRelatedCardData[] = [];
  const rawProject = project as unknown as Record<string, unknown>;

  (project.relatedProjects || []).forEach((value, index) => {
    const slug = resolveReferencedProjectSlug(value);
    const match = projectMap.get(slug);
    if (!slug || !match || results.some((item) => item.slug === slug) || slug === currentSlug) return;

    results.push({
      slug,
      title: match.projectTitle,
      image: match.coverImage,
      focusItemId: getProjectReferenceFocusItemId(value),
      focusListKey: TINA_LIST_KEY_PROJECT_RELATED_PROJECTS,
      tinaField: tinaFieldFn(rawProject, `relatedProjects.${index}.project`) || undefined,
    });
  });

  return results.slice(0, limit);
}

export function getProjectSlug(project: ProjectOverviewItem, fallbackSlug: string): string {
  return toSlug(project.slug || project._sys?.filename || fallbackSlug);
}

export function getProjectHeading(project: ProjectOverviewItem, fallbackSlug: string): string {
  return project.title?.trim() || getProjectDisplayTitle(project, fallbackSlug);
}

export function getProjectDescription(project: ProjectOverviewItem): string {
  return project.description?.trim() || "";
}

export function getProjectPrimaryField(
  project: ProjectOverviewItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  const rawProject = project as unknown as Record<string, unknown>;
  return tinaFieldFn(rawProject, "media.0.file") || undefined;
}

export function getProjectGalleryField(
  project: ProjectOverviewItem,
  item: ProjectGalleryItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  if (!item.source?.raw) return undefined;
  return tinaFieldFn(item.source.raw as Record<string, unknown>, "file") || undefined;
}

export function getProjectGalleryFocusField(
  project: ProjectOverviewItem,
  item: ProjectGalleryItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  if (!item.source?.raw) return undefined;
  return tinaFieldFn(item.source.raw as Record<string, unknown>) || undefined;
}

export function getProjectGalleryAlt(project: ProjectOverviewItem, item: ProjectGalleryItem): string {
  if (item.alt.trim()) return item.alt.trim();
  return humanizeFileName(item.file);
}

function getProjectDisplayTitle(project: ProjectOverviewItem, fallbackSlug = "project"): string {
  const projectSlug = getProjectSlug(project, fallbackSlug);
  return projectSlug ? titleCase(projectSlug) : "Project";
}
