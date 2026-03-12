import {
  type CabinetData,
  type CabinetGalleryItem,
  type CabinetListItem,
  type CabinetMediaItem,
  type CabinetPageSettings,
  type CabinetPageTextConfig,
  type CabinetProjectItem,
  type CabinetReferenceProduct,
  type CabinetRelatedItem,
  type CabinetRelatedProduct,
  type CabinetTechnicalDetail,
} from "./types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^cabinets\//i, "")
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

function isGenericProjectLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "project") return true;
  if (normalized === "image" || normalized === "photo") return true;
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(normalized);
}

function readNonEmpty(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

const DEFAULT_PROJECT_MOCK_FILES = [
  "/figma/home/project-main.jpg",
  "/figma/home/project-2.jpg",
  "/figma/home/project-3.jpg",
  "/figma/home/project-4.jpg",
];

const DEFAULT_CABINET_PAGE_TEXT: CabinetPageTextConfig = {
  breadcrumbLabel: "Cabinets",
  technicalDetailsTitle: "Technical Details",
  contactButtonLabel: "Contact us",
  descriptionLabel: "Description",
  relatedProductsTitle: "Related products",
  projectsSectionTitle: "Material in Real Projects",
  projectsSectionDescription:
    "Explore real installations showcasing this material in completed kitchens, bathrooms, and living spaces to see how it looks and performs in everyday use.",
  projectFallbackTitle: "Project Name",
};

function referenceProductToCard(
  product: CabinetReferenceProduct,
  indexBySlug: Map<string, CabinetListItem>,
  currentSlug: string,
  relation?: CabinetRelatedProduct,
): CabinetRelatedItem | null {
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

export function formatProductCode(code?: string | null): string {
  if (!isTruthyString(code)) return "";
  return `#${code.replace(/^#+/, "").trim()}`;
}

export function sortTechnicalDetails(details: Array<CabinetTechnicalDetail | null> | null | undefined): CabinetTechnicalDetail[] {
  const list = (details || []).filter((item): item is CabinetTechnicalDetail => Boolean(item));

  return list.sort((left, right) => {
    const leftOrder = typeof left.order === "number" ? left.order : Number.POSITIVE_INFINITY;
    const rightOrder = typeof right.order === "number" ? right.order : Number.POSITIVE_INFINITY;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    const leftKey = left.key || "";
    const rightKey = right.key || "";
    return leftKey.localeCompare(rightKey);
  });
}

export function buildGalleryItems(cabinet: CabinetData): CabinetGalleryItem[] {
  const galleryFromMedia = (cabinet.media || [])
    .filter((item): item is CabinetMediaItem => Boolean(item && isTruthyString(item.file)))
    .map((item) => ({ file: item.file!.trim(), sourceType: "media" as const, source: item }));

  const seen = new Set<string>();
  const deduped: CabinetGalleryItem[] = [];

  if (isTruthyString(cabinet.picture) && !seen.has(cabinet.picture.trim())) {
    const picture = cabinet.picture.trim();
    seen.add(picture);
    deduped.push({ file: picture, sourceType: "picture" });
  }

  for (const item of galleryFromMedia) {
    if (seen.has(item.file)) continue;
    seen.add(item.file);
    deduped.push(item);
  }

  return deduped;
}

export function buildProjectItems(
  cabinet: CabinetData,
  options?: {
    maxItems?: number;
    fallbackTitle?: string;
  },
): CabinetProjectItem[] {
  const maxItems = options?.maxItems ?? 4;
  const fallbackTitle = readNonEmpty(options?.fallbackTitle, DEFAULT_CABINET_PAGE_TEXT.projectFallbackTitle);
  const mediaItems = (cabinet.media || []).filter((item): item is CabinetMediaItem => Boolean(item && isTruthyString(item.file)));

  if (!mediaItems.length) return [];

  const mainImage = isTruthyString(cabinet.picture) ? cabinet.picture.trim() : mediaItems[0]?.file?.trim();

  const projectCandidates = mediaItems.filter((item) => {
    if (!isTruthyString(item.file)) return false;
    return item.file.trim() !== mainImage;
  });

  return projectCandidates.slice(0, maxItems).map((item) => {
    const label = isTruthyString(item.label) ? item.label.trim() : "";
    const title = isGenericProjectLabel(label) ? fallbackTitle : label;

    return {
      file: item.file!.trim(),
      title,
      source: item,
    };
  });
}

export function resolveCabinetPageText(settings?: CabinetPageSettings | null): CabinetPageTextConfig {
  return {
    breadcrumbLabel: readNonEmpty(settings?.breadcrumbLabel, DEFAULT_CABINET_PAGE_TEXT.breadcrumbLabel),
    technicalDetailsTitle: readNonEmpty(settings?.technicalDetailsTitle, DEFAULT_CABINET_PAGE_TEXT.technicalDetailsTitle),
    contactButtonLabel: readNonEmpty(settings?.contactButtonLabel, DEFAULT_CABINET_PAGE_TEXT.contactButtonLabel),
    descriptionLabel: readNonEmpty(settings?.descriptionLabel, DEFAULT_CABINET_PAGE_TEXT.descriptionLabel),
    relatedProductsTitle: readNonEmpty(settings?.relatedProductsTitle, DEFAULT_CABINET_PAGE_TEXT.relatedProductsTitle),
    projectsSectionTitle: readNonEmpty(settings?.projectsSectionTitle, DEFAULT_CABINET_PAGE_TEXT.projectsSectionTitle),
    projectsSectionDescription: readNonEmpty(
      settings?.projectsSectionDescription,
      DEFAULT_CABINET_PAGE_TEXT.projectsSectionDescription,
    ),
    projectFallbackTitle: readNonEmpty(settings?.projectFallbackTitle, DEFAULT_CABINET_PAGE_TEXT.projectFallbackTitle),
  };
}

export function buildMockProjectItems(
  cabinet: CabinetData,
  settings?: CabinetPageSettings | null,
  maxItems = 4,
): CabinetProjectItem[] {
  const text = resolveCabinetPageText(settings);

  const configuredMocks = (settings?.mockProjects || [])
    .map((item) => {
      const file = typeof item?.file === "string" ? item.file.trim() : "";
      const title = typeof item?.title === "string" ? item.title.trim() : "";
      if (!file) return null;
      return {
        file,
        title: title || text.projectFallbackTitle,
      };
    })
    .filter((item): item is { file: string; title: string } => Boolean(item));

  const baseMocks = configuredMocks.length
    ? configuredMocks
    : DEFAULT_PROJECT_MOCK_FILES.map((file) => ({
        file,
        title: text.projectFallbackTitle,
      }));

  const picked = baseMocks.slice(0, maxItems);
  if (picked.length) {
    return picked.map((item) => ({
      file: item.file,
      title: item.title,
      isMock: true,
    }));
  }

  const fallbackImage =
    (typeof cabinet.picture === "string" ? cabinet.picture.trim() : "") ||
    (cabinet.media || [])
      .map((item) => (typeof item?.file === "string" ? item.file.trim() : ""))
      .find(Boolean) ||
    "";

  if (!fallbackImage) return [];

  return Array.from({ length: maxItems }, () => ({
    file: fallbackImage,
    title: text.projectFallbackTitle,
    isMock: true,
  }));
}

export function getAdjacentCabinets(
  cabinetIndex: CabinetListItem[],
  currentSlug: string,
): { previous?: CabinetListItem; next?: CabinetListItem } {
  if (!cabinetIndex.length) return {};

  const index = cabinetIndex.findIndex((item) => item.slug === currentSlug);
  if (index < 0) return {};

  return {
    previous: index > 0 ? cabinetIndex[index - 1] : undefined,
    next: index < cabinetIndex.length - 1 ? cabinetIndex[index + 1] : undefined,
  };
}

export function buildRelatedItems(
  cabinet: CabinetData,
  cabinetIndex: CabinetListItem[],
  currentSlug: string,
  maxItems = 4,
): CabinetRelatedItem[] {
  const indexBySlug = new Map<string, CabinetListItem>(cabinetIndex.map((item) => [item.slug, item]));
  const results: CabinetRelatedItem[] = [];
  const seen = new Set<string>();

  const pushResult = (item: CabinetRelatedItem | null) => {
    if (!item || !item.slug || seen.has(item.slug) || item.slug === currentSlug) return;
    seen.add(item.slug);
    results.push(item);
  };

  for (const relation of cabinet.relatedProducts || []) {
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

  if (results.length < maxItems) {
    const sameTone = cabinetIndex.filter((item) => {
      if (item.slug === currentSlug || seen.has(item.slug)) return false;
      if (isTruthyString(cabinet.paint) && item.paint === cabinet.paint) return true;
      if (isTruthyString(cabinet.stainType) && item.stainType === cabinet.stainType) return true;
      return false;
    });

    for (const item of sameTone) {
      if (results.length >= maxItems) break;
      pushResult({
        slug: item.slug,
        name: item.name,
        code: item.code || undefined,
        image: item.picture || undefined,
      });
    }
  }

  if (results.length < maxItems) {
    for (const item of cabinetIndex) {
      if (results.length >= maxItems) break;
      pushResult({
        slug: item.slug,
        name: item.name,
        code: item.code || undefined,
        image: item.picture || undefined,
      });
    }
  }

  return results.slice(0, maxItems);
}

export function getCabinetDisplayName(cabinet: CabinetData, fallbackSlug: string): string {
  if (isTruthyString(cabinet.name)) return cabinet.name.trim();
  return humanizeSlug(fallbackSlug);
}

export function getCabinetSlug(cabinet: CabinetData, fallbackSlug: string): string {
  if (isTruthyString(cabinet.slug)) return toSlug(cabinet.slug);
  if (isTruthyString(cabinet._sys?.filename)) return toSlug(cabinet._sys.filename);
  return toSlug(fallbackSlug);
}
