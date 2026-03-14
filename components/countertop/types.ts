import type {
  CabinetPageSettings,
  CabinetPageTextConfig,
} from "@/components/cabinet-door/types";
import type {
  ProductGalleryItemViewModel,
  ProductProjectCardItem,
  ProductRelatedCardItem,
  ProductTechnicalDetailViewModel,
} from "@/components/catalog-product/types";
import type { ProjectMediaItem, ProjectOverviewItem } from "@/components/gallery-overview/types";

export type {
  CabinetPageSettings,
  CabinetPageTextConfig,
  ProductGalleryItemViewModel,
  ProductProjectCardItem,
  ProductRelatedCardItem,
  ProductTechnicalDetailViewModel,
};

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

export interface CountertopData {
  __typename?: string;
  _sys?: CountertopSystemInfo | null;
  id?: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  countertopType?: string | null;
  inStock?: boolean | null;
  storeCollection?: string | null;
  description?: string | null;
  picture?: string | null;
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
  inStock?: boolean;
  storeCollection?: string;
}

export interface CountertopProjectItem {
  file: string;
  title: string;
  project?: ProjectOverviewItem;
  media?: ProjectMediaItem;
}

export interface CountertopRelatedItem {
  slug: string;
  name: string;
  code?: string;
  image?: string;
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
}
