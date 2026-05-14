import { buildGalleryProjects } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewDataShape } from "@/components/special/gallery-overview/types";
import {
  getCabinetProductFocusItemId,
  getCountertopProductFocusItemId,
  getFlooringProductFocusItemId,
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
  TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
  TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS,
  TINA_LIST_KEY_PROJECT_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import type {
  CabinetListItem,
  CountertopListItem,
  FlooringListItem,
  ProjectGalleryItem,
  ProjectMaterialCardData,
  ProjectOverviewItem,
  ProjectRelatedCardData,
} from "./types";

const PLACEHOLDER_CABINET = "/library/catalog/material-placeholder-cabinet.svg";
const PLACEHOLDER_COUNTERTOP = "/library/catalog/material-placeholder-countertop.svg";
const PLACEHOLDER_FLOORING = "/library/catalog/material-placeholder-flooring.svg";

export interface MaterialCardsGroupConfig {
  label?: string | null;
  placeholderImage?: string | null;
}

export interface MaterialCardsConfig {
  cabinet?: MaterialCardsGroupConfig | null;
  countertop?: MaterialCardsGroupConfig | null;
  flooring?: MaterialCardsGroupConfig | null;
}

function resolveGroupLabel(
  configured: string | null | undefined,
  fallback: string,
): string {
  const trimmed = (configured || "").trim();
  return trimmed || fallback;
}

function resolveGroupPlaceholder(
  configured: string | null | undefined,
  fallback: string,
): string {
  const trimmed = (configured || "").trim();
  return trimmed || fallback;
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

function toCollectionSlug(value: string, collectionName: "cabinets" | "countertops" | "flooring"): string {
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
  collectionName: "cabinets" | "countertops" | "flooring",
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
  collectionName: "cabinets" | "countertops" | "flooring",
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
  flooringIndex: FlooringListItem[] = [],
  config: MaterialCardsConfig = {},
): ProjectMaterialCardData[] {
  const cards: ProjectMaterialCardData[] = [];
  const rawProject = project as unknown as Record<string, unknown>;
  const cabinetIndexBySlug = new Map(cabinetIndex.map((item) => [item.slug, item]));
  const countertopIndexBySlug = new Map(countertopIndex.map((item) => [item.slug, item]));
  const flooringIndexBySlug = new Map(flooringIndex.map((item) => [item.slug, item]));

  const cabinetLabel = resolveGroupLabel(config.cabinet?.label, "Cabinet door");
  const countertopLabel = resolveGroupLabel(config.countertop?.label, "Countertop");
  const flooringLabel = resolveGroupLabel(config.flooring?.label, "Flooring");
  const cabinetPlaceholder = resolveGroupPlaceholder(config.cabinet?.placeholderImage, PLACEHOLDER_CABINET);
  const countertopPlaceholder = resolveGroupPlaceholder(config.countertop?.placeholderImage, PLACEHOLDER_COUNTERTOP);
  const flooringPlaceholder = resolveGroupPlaceholder(config.flooring?.placeholderImage, PLACEHOLDER_FLOORING);

  (project.cabinetProducts || []).forEach((item, index) => {
    const linked = resolveReferencedProductCard(item?.cabinet, "cabinets", cabinetIndexBySlug);
    const itemField = tinaFieldFn(rawProject, `cabinetProducts.${index}`) || undefined;
    // Unified focus ID: linked cabinet ref if present, else synthetic `custom:<name>` so
    // customName-only items can also be scrolled/highlighted in the Tina sidebar.
    const focusItemId = getCabinetProductFocusItemId(item || undefined);
    if (linked) {
      cards.push({
        kind: "cabinet",
        label: cabinetLabel,
        title: linked.title,
        subtitle: linked.subtitle,
        image: linked.image,
        href: `/cabinets/${linked.slug}`,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
        tinaField: itemField,
      });
    } else if (item?.customName?.trim()) {
      cards.push({
        kind: "cabinet",
        label: cabinetLabel,
        title: item.customName.trim(),
        subtitle: item.subtitle?.trim() || undefined,
        image: cabinetPlaceholder,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
        tinaField: itemField,
      });
    } else if (item?.type?.trim()) {
      cards.push({
        kind: "cabinet",
        label: cabinetLabel,
        title: item.type.trim(),
        image: cabinetPlaceholder,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
        tinaField: itemField,
      });
    }
  });

  (project.countertopProducts || []).forEach((item, index) => {
    const linked = resolveReferencedProductCard(item?.countertop, "countertops", countertopIndexBySlug);
    const itemField = tinaFieldFn(rawProject, `countertopProducts.${index}`) || undefined;
    const focusItemId = getCountertopProductFocusItemId(item || undefined);
    if (linked) {
      cards.push({
        kind: "countertop",
        label: countertopLabel,
        title: linked.title,
        subtitle: linked.subtitle,
        image: linked.image,
        href: `/countertops/${linked.slug}`,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
        tinaField: itemField,
      });
    } else if (item?.customName?.trim()) {
      cards.push({
        kind: "countertop",
        label: countertopLabel,
        title: item.customName.trim(),
        subtitle: item.subtitle?.trim() || undefined,
        image: countertopPlaceholder,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
        tinaField: itemField,
      });
    } else if (item?.type?.trim()) {
      cards.push({
        kind: "countertop",
        label: countertopLabel,
        title: item.type.trim(),
        image: countertopPlaceholder,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
        tinaField: itemField,
      });
    }
  });

  (project.flooringProducts || []).forEach((item, index) => {
    const linked = resolveReferencedProductCard(item?.flooring, "flooring", flooringIndexBySlug);
    const itemField = tinaFieldFn(rawProject, `flooringProducts.${index}`) || undefined;
    const focusItemId = getFlooringProductFocusItemId(item || undefined);
    if (linked) {
      cards.push({
        kind: "flooring",
        label: flooringLabel,
        title: linked.title,
        subtitle: linked.subtitle,
        image: linked.image,
        href: `/flooring/catalog/${linked.slug}`,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS,
        tinaField: itemField,
      });
    } else if (item?.customName?.trim()) {
      cards.push({
        kind: "flooring",
        label: flooringLabel,
        title: item.customName.trim(),
        subtitle: item.subtitle?.trim() || undefined,
        image: flooringPlaceholder,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS,
        tinaField: itemField,
      });
    } else if (item?.type?.trim()) {
      cards.push({
        kind: "flooring",
        label: flooringLabel,
        title: item.type.trim(),
        image: flooringPlaceholder,
        focusItemId,
        focusListKey: TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS,
        tinaField: itemField,
      });
    }
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
