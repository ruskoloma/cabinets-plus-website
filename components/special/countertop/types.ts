import type {
  CabinetPageSettings,
  CabinetPageSettingsQueryLikeResult,
  CabinetPageTextConfig,
  CabinetSystemInfo,
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
  CabinetPageSettingsQueryLikeResult,
  CabinetPageTextConfig,
  ProductGalleryItemViewModel,
  ProductProjectCardItem,
  ProductRelatedCardItem,
  ProductTechnicalDetailViewModel,
};

// Countertop page settings are block-driven (matches cabinet shape).
export interface CountertopPageSettingsBlock {
  __typename?: string | null;
  _template?: string | null;
  [key: string]: unknown;
}

export interface CountertopPageSettings {
  __typename?: string;
  id?: string;
  _sys?: CabinetSystemInfo | null;
  _content_source?: unknown;
  blocks?: Array<CountertopPageSettingsBlock | null> | null;
}

export interface CountertopPageSettingsQueryLikeResult {
  data: { countertopPageSettings?: CountertopPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CountertopSystemInfo {
  filename?: string;
  basename?: string;
  relativePath?: string;
}

export interface CountertopTechnicalDetail {
  __typename?: string;
  key?: string | null;
  value?: string | null;
  unit?: string | null;
  order?: number | null;
  _content_source?: unknown;
}

export interface CountertopMediaItem {
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

export interface CountertopReferenceProduct {
  __typename?: string;
  _sys?: CountertopSystemInfo | null;
  id?: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  countertopType?: string | null;
  description?: string | null;
  picture?: string | null;
  _content_source?: unknown;
}

export interface CountertopRelatedProduct {
  __typename?: string;
  product?: CountertopReferenceProduct | string | null;
  _content_source?: unknown;
}

export interface CountertopData {
  __typename?: string;
  _sys?: CountertopSystemInfo | null;
  id?: string;
  published?: boolean | null;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  countertopType?: string | null;
  description?: string | null;
  picture?: string | null;
  relatedProjects?: Array<string | null> | null;
  relatedProducts?: Array<CountertopRelatedProduct | null> | null;
  technicalDetails?: Array<CountertopTechnicalDetail | null> | null;
  media?: Array<CountertopMediaItem | null> | null;
  sourceId?: number | null;
  sourceUpdatedAt?: string | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface CountertopQueryLikeResult {
  data: { countertop?: CountertopData | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CountertopListItem {
  filename: string;
  slug: string;
  name: string;
  code: string;
  picture: string;
  countertopType?: string;
}

export interface CountertopProjectItem {
  file: string;
  title: string;
  href?: string;
  selectionIndex?: number;
  projectSource?: Record<string, unknown>;
  mediaSource?: Record<string, unknown>;
  project?: ProjectOverviewItem;
  media?: ProjectMediaItem;
}

export interface CountertopRelatedItem {
  slug: string;
  name: string;
  code?: string;
  image?: string;
  relation?: CountertopRelatedProduct;
}

export interface CountertopDetailPageProps {
  countertop: CountertopData;
  currentSlug: string;
  previousProduct?: CountertopListItem;
  nextProduct?: CountertopListItem;
  galleryItems: ProductGalleryItemViewModel[];
  technicalDetails: ProductTechnicalDetailViewModel[];
  projectItems: CountertopProjectItem[];
  relatedItems: CountertopRelatedItem[];
  pageText: CabinetPageTextConfig;
  contactBlock?: Record<string, unknown> | null;
  pageSettingsRecord?: Record<string, unknown> | null;
}
