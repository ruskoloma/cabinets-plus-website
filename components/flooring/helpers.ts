import { resolveCabinetPageText } from "@/components/cabinet-door/helpers";
import { buildFlooringProjectMatches } from "@/components/catalog-product/project-matching";
import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import type { GalleryOverviewDataShape } from "@/components/gallery-overview/types";
import type {
  CabinetPageSettings,
  FlooringData,
  FlooringListItem,
  FlooringMediaItem,
  FlooringProjectItem,
  FlooringReferenceProduct,
  FlooringRelatedItem,
  FlooringRelatedProduct,
  FlooringTechnicalDetail,
  ProductGalleryItemViewModel,
} from "./types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^flooring\//i, "")
    .replace(/\s+/g, "-");
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeReferenceToSlug(reference: string): string {
  const normalized = reference.trim().replace(/^\//, "");
  const lastSegment = normalized.split("/").pop() || normalized;
  return toSlug(lastSegment);
}

function isTruthyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const DEFAULT_PROJECT_CARD_TITLE = "Project";

function referenceProductToCard(
  product: FlooringReferenceProduct,
  indexBySlug: Map<string, FlooringListItem>,
  currentSlug: string,
  relation?: FlooringRelatedProduct,
): FlooringRelatedItem | null {
  const productSlug =
    (isTruthyString(product.slug) ? toSlug(product.slug) : "") ||
    (isTruthyString(product._sys?.filename) ? toSlug(product._sys.filename) : "") ||
    (isTruthyString(product._sys?.relativePath) ? normalizeReferenceToSlug(product._sys.relativePath) : "");

  if (!productSlug || productSlug === currentSlug) return null;

  const matched = indexBySlug.get(productSlug);
  return {
    slug: productSlug,
    name: (isTruthyString(product.name) ? product.name.trim() : matched?.name) || humanizeSlug(productSlug),
    code: (isTruthyString(product.code) ? product.code.trim() : matched?.code) || undefined,
    image: (isTruthyString(product.picture) ? product.picture.trim() : matched?.picture) || undefined,
    relation,
  };
}

function getPrimaryImage(flooring: FlooringData): string {
  const directPicture = isTruthyString(flooring.picture) ? flooring.picture.trim() : "";
  if (directPicture) return directPicture;

  const mediaItems = (flooring.media || []).filter((item): item is FlooringMediaItem => Boolean(item && isTruthyString(item.file)));

  const primaryMedia = mediaItems.find((item) => item?.kind === "image" && item?.isPrimary);
  if (isTruthyString(primaryMedia?.file)) return primaryMedia.file.trim();

  const firstImage = mediaItems.find((item) => item?.kind === "image");
  if (isTruthyString(firstImage?.file)) return firstImage.file.trim();

  return isTruthyString(mediaItems[0]?.file) ? mediaItems[0]!.file!.trim() : "";
}

export function sortTechnicalDetails(details: Array<FlooringTechnicalDetail | null> | null | undefined): FlooringTechnicalDetail[] {
  const list = (details || []).filter((item): item is FlooringTechnicalDetail => Boolean(item));

  return list.sort((left, right) => {
    const leftOrder = typeof left.order === "number" ? left.order : Number.POSITIVE_INFINITY;
    const rightOrder = typeof right.order === "number" ? right.order : Number.POSITIVE_INFINITY;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    const leftKey = left.key || "";
    const rightKey = right.key || "";
    return leftKey.localeCompare(rightKey);
  });
}

export function resolveFlooringPageText(settings?: CabinetPageSettings | null) {
  const breadcrumbLabel =
    typeof settings?.breadcrumbLabel === "string" && settings.breadcrumbLabel.trim().length
      ? settings.breadcrumbLabel.trim()
      : "Flooring Catalog";

  return {
    ...resolveCabinetPageText(settings),
    breadcrumbLabel,
  };
}

export function buildFlooringGalleryItems(flooring: FlooringData): ProductGalleryItemViewModel[] {
  const primaryImage = getPrimaryImage(flooring);
  const displayName = flooring.name?.trim() || "Flooring";
  const mediaItems = (flooring.media || []).filter((item): item is FlooringMediaItem => Boolean(item && isTruthyString(item.file)));
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

export function buildFlooringProjectItems(
  flooring: FlooringData,
  overviewData: GalleryOverviewDataShape,
  options?: {
    maxItems?: number;
  },
): FlooringProjectItem[] {
  const maxItems = options?.maxItems ?? 3;
  return buildFlooringProjectMatches(flooring, overviewData, maxItems).map((item) => ({
    file: item.file,
    title: item.title || DEFAULT_PROJECT_CARD_TITLE,
    href: item.href,
    selectionIndex: item.selectionIndex,
    projectSource: item.projectSource,
    mediaSource: item.mediaSource,
  }));
}

export function buildRelatedFlooringItems(
  flooring: FlooringData,
  flooringIndex: FlooringListItem[],
  currentSlug: string,
  maxItems = 4,
): FlooringRelatedItem[] {
  const indexBySlug = new Map<string, FlooringListItem>(flooringIndex.map((item) => [item.slug, item]));
  const results: FlooringRelatedItem[] = [];
  const seen = new Set<string>();

  const pushResult = (item: FlooringRelatedItem | null) => {
    if (!item || !item.slug || seen.has(item.slug) || item.slug === currentSlug) return;
    seen.add(item.slug);
    results.push(item);
  };

  for (const relation of flooring.relatedProducts || []) {
    if (!relation) continue;

    const product = relation.product;

    if (typeof product === "string") {
      const slug = normalizeReferenceToSlug(product);
      const matched = indexBySlug.get(slug);
      if (!matched) continue;

      pushResult({
        slug,
        name: matched.name,
        code: matched.code || undefined,
        image: matched.picture || undefined,
        relation,
      });
      continue;
    }

    if (product && typeof product === "object") {
      pushResult(referenceProductToCard(product, indexBySlug, currentSlug, relation));
    }
  }

  return results.slice(0, maxItems);
}

export function getAdjacentFloorings(
  flooringIndex: FlooringListItem[],
  currentSlug: string,
): { previous?: FlooringListItem; next?: FlooringListItem } {
  if (!flooringIndex.length) return {};

  const index = flooringIndex.findIndex((item) => item.slug === currentSlug);
  if (index < 0) return {};

  return {
    previous: index > 0 ? flooringIndex[index - 1] : undefined,
    next: index < flooringIndex.length - 1 ? flooringIndex[index + 1] : undefined,
  };
}

export function getFlooringDisplayName(flooring: FlooringData, fallbackSlug: string): string {
  if (isTruthyString(flooring.name)) return flooring.name.trim();
  return humanizeSlug(fallbackSlug);
}

export function getFlooringSlug(flooring: FlooringData, fallbackSlug: string): string {
  if (isTruthyString(flooring.slug)) return toSlug(flooring.slug);
  if (isTruthyString(flooring._sys?.filename)) return toSlug(flooring._sys.filename);
  return toSlug(fallbackSlug);
}
