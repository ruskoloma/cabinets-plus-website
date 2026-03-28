import { resolveCabinetPageText } from "@/components/cabinet-door/helpers";
import { buildCountertopProjectMatches } from "@/components/catalog-product/project-matching";
import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import type { GalleryOverviewDataShape } from "@/components/gallery-overview/types";
import type {
  CabinetPageSettings,
  CountertopData,
  CountertopListItem,
  CountertopMediaItem,
  CountertopProjectItem,
  CountertopRelatedItem,
  CountertopTechnicalDetail,
  ProductGalleryItemViewModel,
} from "./types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^countertops\//i, "")
    .replace(/\s+/g, "-");
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isTruthyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const DEFAULT_PROJECT_CARD_TITLE = "Project";

function getPrimaryImage(countertop: CountertopData): string {
  const directPicture = isTruthyString(countertop.picture) ? countertop.picture.trim() : "";
  if (directPicture) return directPicture;

  const mediaItems = (countertop.media || []).filter((item): item is CountertopMediaItem => Boolean(item && isTruthyString(item.file)));

  const primaryMedia = mediaItems.find((item) => item?.kind === "image" && item?.isPrimary);
  if (isTruthyString(primaryMedia?.file)) return primaryMedia.file.trim();

  const firstImage = mediaItems.find((item) => item?.kind === "image");
  if (isTruthyString(firstImage?.file)) return firstImage.file.trim();

  return isTruthyString(mediaItems[0]?.file) ? mediaItems[0]!.file!.trim() : "";
}

export function sortTechnicalDetails(details: Array<CountertopTechnicalDetail | null> | null | undefined): CountertopTechnicalDetail[] {
  const list = (details || []).filter((item): item is CountertopTechnicalDetail => Boolean(item));

  return list.sort((left, right) => {
    const leftOrder = typeof left.order === "number" ? left.order : Number.POSITIVE_INFINITY;
    const rightOrder = typeof right.order === "number" ? right.order : Number.POSITIVE_INFINITY;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    const leftKey = left.key || "";
    const rightKey = right.key || "";
    return leftKey.localeCompare(rightKey);
  });
}

export function resolveCountertopPageText(settings?: CabinetPageSettings | null) {
  const breadcrumbLabel =
    typeof settings?.breadcrumbLabel === "string" && settings.breadcrumbLabel.trim().length
      ? settings.breadcrumbLabel.trim()
      : "Countertops";

  return {
    ...resolveCabinetPageText(settings),
    breadcrumbLabel,
  };
}

export function buildCountertopGalleryItems(countertop: CountertopData): ProductGalleryItemViewModel[] {
  const primaryImage = getPrimaryImage(countertop);
  const displayName = countertop.name?.trim() || "Countertop";
  const mediaItems = (countertop.media || []).filter((item): item is CountertopMediaItem => Boolean(item && isTruthyString(item.file)));
  const seen = new Set<string>();
  const items: ProductGalleryItemViewModel[] = [];

  if (primaryImage && !seen.has(primaryImage)) {
    seen.add(primaryImage);
    items.push({
      id: `picture-${primaryImage}`,
      kind: "image",
      file: primaryImage,
      previewFile: primaryImage,
      alt: displayName,
    });
  }

  for (const item of mediaItems) {
    const file = item.file!.trim();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    const normalizedKind = normalizeOptionValue(item.kind || "") === "video" ? "video" : "image";

    items.push({
      id: `${normalizedKind}-${file}`,
      kind: normalizedKind,
      file,
      previewFile: normalizedKind === "video" ? primaryImage || file : file,
      alt: item.altText?.trim() || item.label?.trim() || displayName,
    });
  }

  return items;
}

export function buildCountertopProjectItems(
  countertop: CountertopData,
  overviewData: GalleryOverviewDataShape,
  options?: {
    maxItems?: number;
  },
): CountertopProjectItem[] {
  const maxItems = options?.maxItems ?? 3;
  const matchedProjects = buildCountertopProjectMatches(countertop, overviewData, maxItems).map((item) => ({
    file: item.file,
    title: item.title || DEFAULT_PROJECT_CARD_TITLE,
    href: item.href,
    projectSource: item.projectSource,
    mediaSource: item.mediaSource,
  }));

  if (matchedProjects.length) {
    return matchedProjects;
  }

  const primaryImage = getPrimaryImage(countertop);
  const mediaItems = (countertop.media || []).filter(
    (item): item is CountertopMediaItem =>
      Boolean(item && isTruthyString(item.file) && normalizeOptionValue(item.kind || "") !== "video"),
  );

  return mediaItems
    .filter((item) => item.file!.trim() !== primaryImage)
    .slice(0, maxItems)
    .map((item) => ({
      file: item.file!.trim(),
      title: item.label?.trim() || item.altText?.trim() || DEFAULT_PROJECT_CARD_TITLE,
      media: item,
    }));
}

function scoreRelatedCountertop(
  item: CountertopListItem,
  countertop: CountertopData,
  normalizedType: string,
): number {
  let score = 0;
  const itemType = normalizeOptionValue(item.countertopType || "");
  const currentName = normalizeOptionValue(countertop.name || "");
  const itemName = normalizeOptionValue(item.name || "");
  const currentWords = currentName.split(" ").filter((word) => word.length > 3);

  if (normalizedType && itemType === normalizedType) score += 6;
  if (countertop.inStock === item.inStock) score += 2;
  if (countertop.storeCollection?.trim() && countertop.storeCollection === item.storeCollection) score += 1;
  if (item.picture) score += 1;

  for (const word of currentWords) {
    if (word && itemName.includes(word)) score += 1;
  }

  return score;
}

export function buildRelatedCountertopItems(
  countertop: CountertopData,
  countertopIndex: CountertopListItem[],
  currentSlug: string,
  maxItems = 4,
): CountertopRelatedItem[] {
  const normalizedType = normalizeOptionValue(countertop.countertopType || "");

  return countertopIndex
    .filter((item) => item.slug !== currentSlug)
    .map((item) => ({
      item,
      score: scoreRelatedCountertop(item, countertop, normalizedType),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.item.name.localeCompare(right.item.name);
    })
    .slice(0, maxItems)
    .map(({ item }) => ({
      slug: item.slug,
      name: item.name,
      code: item.code || undefined,
      image: item.picture || undefined,
    }));
}

export function getAdjacentCountertops(
  countertopIndex: CountertopListItem[],
  currentSlug: string,
): { previous?: CountertopListItem; next?: CountertopListItem } {
  if (!countertopIndex.length) return {};

  const index = countertopIndex.findIndex((item) => item.slug === currentSlug);
  if (index < 0) return {};

  return {
    previous: index > 0 ? countertopIndex[index - 1] : undefined,
    next: index < countertopIndex.length - 1 ? countertopIndex[index + 1] : undefined,
  };
}

export function getCountertopDisplayName(countertop: CountertopData, fallbackSlug: string): string {
  if (isTruthyString(countertop.name)) return countertop.name.trim();
  return humanizeSlug(fallbackSlug);
}

export function getCountertopSlug(countertop: CountertopData, fallbackSlug: string): string {
  if (isTruthyString(countertop.slug)) return toSlug(countertop.slug);
  if (isTruthyString(countertop._sys?.filename)) return toSlug(countertop._sys.filename);
  return toSlug(fallbackSlug);
}
