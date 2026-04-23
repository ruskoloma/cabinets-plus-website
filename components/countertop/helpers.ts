import { buildCountertopProjectMatches } from "@/components/catalog-product/project-matching";
import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import type { GalleryOverviewDataShape } from "@/components/gallery-overview/types";
import type { CabinetPageTextConfig } from "@/components/cabinet-door/types";
import type {
  CountertopData,
  CountertopListItem,
  CountertopMediaItem,
  CountertopPageSettings,
  CountertopPageSettingsBlock,
  CountertopProjectItem,
  CountertopReferenceProduct,
  CountertopRelatedItem,
  CountertopRelatedProduct,
  CountertopTechnicalDetail,
  ProductGalleryItemViewModel,
} from "./types";

const TYPENAME_TO_TEMPLATE: Record<string, string> = {
  PageSettingsCountertopBlocksCountertopProductInfo: "countertopProductInfo",
  PageSettingsCountertopBlocksProjectsUsingThisProduct: "projectsUsingThisProduct",
  PageSettingsCountertopBlocksRelatedProducts: "relatedProducts",
  PageSettingsCountertopBlocksTextImageSection: "textImageSection",
  PageSettingsCountertopBlocksFaqSection: "faqSection",
  PageSettingsCountertopBlocksShowroomBanner: "showroomBanner",
  PageSettingsCountertopBlocksPartnersSection: "partnersSection",
  PageSettingsCountertopBlocksCountertopPartnersSection: "countertopPartnersSection",
  PageSettingsCountertopBlocksFlooringPartnersSection: "flooringPartnersSection",
  PageSettingsCountertopBlocksContactSection: "contactSection",
};

function resolveBlockTemplate(block: CountertopPageSettingsBlock | null | undefined): string | null {
  if (!block || typeof block !== "object") return null;
  const rawTemplate = typeof block._template === "string" ? block._template : null;
  if (rawTemplate) return rawTemplate;
  const typename = typeof block.__typename === "string" ? block.__typename : "";
  return TYPENAME_TO_TEMPLATE[typename] || null;
}

export function findCountertopBlock(
  blocks: Array<CountertopPageSettingsBlock | null> | null | undefined,
  template: string,
): CountertopPageSettingsBlock | null {
  if (!Array.isArray(blocks)) return null;
  for (const block of blocks) {
    if (!block) continue;
    if (resolveBlockTemplate(block) === template) return block;
  }
  return null;
}

export const DEFAULT_COUNTERTOP_PAGE_TEXT: CabinetPageTextConfig = {
  breadcrumbLabel: "Countertops",
  technicalDetailsTitle: "Technical Details",
  contactButtonLabel: "Contact us",
  descriptionLabel: "Description",
  relatedProductsTitle: "Related products",
  projectsSectionTitle: "Material in Real Projects",
  projectsSectionDescription:
    "Explore real installations showcasing this material in completed kitchens, bathrooms, and living spaces to see how it looks and performs in everyday use.",
};

function readNonEmpty(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
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
  product: CountertopReferenceProduct,
  indexBySlug: Map<string, CountertopListItem>,
  currentSlug: string,
  relation?: CountertopRelatedProduct,
): CountertopRelatedItem | null {
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

export function resolveCountertopPageText(settings?: CountertopPageSettings | null): CabinetPageTextConfig {
  const blocks = settings?.blocks;
  const productInfoBlock = findCountertopBlock(blocks, "countertopProductInfo");
  const projectsBlock = findCountertopBlock(blocks, "projectsUsingThisProduct");
  const relatedProductsBlock = findCountertopBlock(blocks, "relatedProducts");

  return {
    breadcrumbLabel: readNonEmpty(productInfoBlock?.breadcrumbLabel, DEFAULT_COUNTERTOP_PAGE_TEXT.breadcrumbLabel),
    technicalDetailsTitle: readNonEmpty(
      productInfoBlock?.technicalDetailsTitle,
      DEFAULT_COUNTERTOP_PAGE_TEXT.technicalDetailsTitle,
    ),
    contactButtonLabel: readNonEmpty(
      productInfoBlock?.contactButtonLabel,
      DEFAULT_COUNTERTOP_PAGE_TEXT.contactButtonLabel,
    ),
    descriptionLabel: readNonEmpty(productInfoBlock?.descriptionLabel, DEFAULT_COUNTERTOP_PAGE_TEXT.descriptionLabel),
    relatedProductsTitle: readNonEmpty(relatedProductsBlock?.title, DEFAULT_COUNTERTOP_PAGE_TEXT.relatedProductsTitle),
    projectsSectionTitle: readNonEmpty(projectsBlock?.title, DEFAULT_COUNTERTOP_PAGE_TEXT.projectsSectionTitle),
    projectsSectionDescription: readNonEmpty(
      projectsBlock?.description,
      DEFAULT_COUNTERTOP_PAGE_TEXT.projectsSectionDescription,
    ),
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
    selectionIndex: item.selectionIndex,
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

export function buildRelatedCountertopItems(
  countertop: CountertopData,
  countertopIndex: CountertopListItem[],
  currentSlug: string,
  maxItems = 4,
): CountertopRelatedItem[] {
  const indexBySlug = new Map<string, CountertopListItem>(countertopIndex.map((item) => [item.slug, item]));
  const results: CountertopRelatedItem[] = [];
  const seen = new Set<string>();

  const pushResult = (item: CountertopRelatedItem | null) => {
    if (!item || !item.slug || seen.has(item.slug) || item.slug === currentSlug) return;
    seen.add(item.slug);
    results.push(item);
  };

  for (const relation of countertop.relatedProducts || []) {
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
