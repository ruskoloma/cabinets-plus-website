import { buildGalleryProjects } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewDataShape } from "@/components/special/gallery-overview/types";
import {
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_COLLECTION_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import type {
  CollectionGalleryItem,
  CollectionOverviewItem,
  CollectionRelatedProjectCardData,
} from "./types";

function toCollectionSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^collections\//i, "")
    .replace(/\s+/g, "-");
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

function resolveReferencedProjectSlug(
  value: string | { slug?: string | null; _sys?: { filename?: string; relativePath?: string } | null } | null | undefined,
): string {
  if (!value) return "";
  if (typeof value === "string") return toProjectSlug(value);

  return toProjectSlug(
    value.slug || value._sys?.relativePath || value._sys?.filename || "",
  );
}

export function getCollectionSlug(collection: CollectionOverviewItem, fallbackSlug: string): string {
  return toCollectionSlug(collection.slug || collection._sys?.filename || fallbackSlug);
}

function getCollectionDisplayTitle(collection: CollectionOverviewItem, fallbackSlug = "collection"): string {
  const slug = getCollectionSlug(collection, fallbackSlug);
  return slug ? titleCase(slug) : "Collection";
}

export function getCollectionHeading(collection: CollectionOverviewItem, fallbackSlug: string): string {
  return collection.title?.trim() || getCollectionDisplayTitle(collection, fallbackSlug);
}

export function getCollectionDescription(collection: CollectionOverviewItem): string {
  return collection.description?.trim() || "";
}

export function buildCollectionGallery(collection: CollectionOverviewItem): CollectionGalleryItem[] {
  const items: CollectionGalleryItem[] = [];
  const seen = new Set<string>();
  const title = getCollectionDisplayTitle(collection);

  for (const media of collection.media || []) {
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

export function getCollectionGalleryAlt(collection: CollectionOverviewItem, item: CollectionGalleryItem): string {
  if (item.alt.trim()) return item.alt.trim();
  return humanizeFileName(item.file);
}

export function buildCollectionRelatedProjectCards(
  collection: CollectionOverviewItem,
  overviewData: GalleryOverviewDataShape,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
  limit = 3,
): CollectionRelatedProjectCardData[] {
  const projectCards = buildGalleryProjects(overviewData);
  const projectMap = new Map(projectCards.map((item) => [item.projectSlug, item]));
  const results: CollectionRelatedProjectCardData[] = [];
  const rawCollection = collection as unknown as Record<string, unknown>;

  (collection.relatedProjects || []).forEach((value, index) => {
    const slug = resolveReferencedProjectSlug(value as string | { slug?: string | null } | null | undefined);
    const match = projectMap.get(slug);
    if (!slug || !match || results.some((item) => item.slug === slug)) return;

    results.push({
      slug,
      title: match.projectTitle,
      image: match.coverImage,
      focusItemId: getProjectReferenceFocusItemId(value),
      focusListKey: TINA_LIST_KEY_COLLECTION_RELATED_PROJECTS,
      tinaField: tinaFieldFn(rawCollection, `relatedProjects.${index}.project`) || undefined,
    });
  });

  return results.slice(0, limit);
}
