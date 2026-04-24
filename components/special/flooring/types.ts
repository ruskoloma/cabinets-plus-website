import type {
  CabinetPageSettings,
  CabinetPageSettingsBlock,
  CabinetPageSettingsQueryLikeResult,
  CabinetPageTextConfig,
} from "@/components/special/cabinet-door/types";
import type {
  ProductGalleryItemViewModel,
  ProductProjectCardItem,
  ProductRelatedCardItem,
  ProductTechnicalDetailViewModel,
} from "@/components/special/catalog-product/types";
import type { ProjectMediaItem, ProjectOverviewItem } from "@/components/special/gallery-overview/types";

export type {
  CabinetPageSettings,
  CabinetPageSettingsBlock,
  CabinetPageSettingsQueryLikeResult,
  CabinetPageTextConfig,
  ProductGalleryItemViewModel,
  ProductProjectCardItem,
  ProductRelatedCardItem,
  ProductTechnicalDetailViewModel,
};

// Flooring page settings share the block-based shape of cabinet/countertop
// settings — the block templates are flooring-specific (e.g. flooringProductInfo)
// but the document structure (`{ blocks: [...] }`) is identical.
export type FlooringPageSettings = CabinetPageSettings;
export type FlooringPageSettingsBlock = CabinetPageSettingsBlock;

export interface FlooringPageSettingsQueryLikeResult {
  data: { flooringPageSettings?: FlooringPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface FlooringSystemInfo {
  filename?: string;
  basename?: string;
  relativePath?: string;
}

export interface FlooringTechnicalDetail {
  __typename?: string;
  key?: string | null;
  value?: string | null;
  unit?: string | null;
  order?: number | null;
  _content_source?: unknown;
}

export interface FlooringMediaItem {
  __typename?: string;
  file?: string | null;
  kind?: string | null;
  mimeType?: string | null;
  isPrimary?: boolean | null;
  label?: string | null;
  altText?: string | null;
  description?: string | null;
  sourceId?: number | null;
  _content_source?: unknown;
}

export interface FlooringReferenceProduct {
  __typename?: string;
  _sys?: FlooringSystemInfo | null;
  id?: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  flooringType?: string | null;
  description?: string | null;
  picture?: string | null;
  _content_source?: unknown;
}

export interface FlooringRelatedProduct {
  __typename?: string;
  product?: FlooringReferenceProduct | string | null;
  _content_source?: unknown;
}

export interface FlooringData {
  __typename?: string;
  _sys?: FlooringSystemInfo | null;
  id?: string;
  published?: boolean | null;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  flooringType?: string | null;
  description?: string | null;
  picture?: string | null;
  relatedProjects?: Array<string | null> | null;
  relatedProducts?: Array<FlooringRelatedProduct | null> | null;
  technicalDetails?: Array<FlooringTechnicalDetail | null> | null;
  media?: Array<FlooringMediaItem | null> | null;
  sourceId?: number | null;
  sourceUpdatedAt?: string | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface FlooringQueryLikeResult {
  data: { flooring?: FlooringData | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface FlooringListItem {
  filename: string;
  slug: string;
  name: string;
  code: string;
  picture: string;
  flooringType?: string;
}

export interface FlooringProjectItem {
  file: string;
  title: string;
  href?: string;
  selectionIndex?: number;
  projectSource?: Record<string, unknown>;
  mediaSource?: Record<string, unknown>;
  project?: ProjectOverviewItem;
  media?: ProjectMediaItem;
}

export interface FlooringRelatedItem {
  slug: string;
  name: string;
  code?: string;
  image?: string;
  relation?: FlooringRelatedProduct;
}

export interface FlooringDetailPageProps {
  flooring: FlooringData;
  currentSlug: string;
  previousProduct?: FlooringListItem;
  nextProduct?: FlooringListItem;
  galleryItems: ProductGalleryItemViewModel[];
  technicalDetails: ProductTechnicalDetailViewModel[];
  projectItems: FlooringProjectItem[];
  relatedItems: FlooringRelatedItem[];
  pageText: CabinetPageTextConfig;
  contactBlock?: Record<string, unknown> | null;
  pageSettingsRecord?: Record<string, unknown> | null;
}
