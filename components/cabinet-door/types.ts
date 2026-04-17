export interface CabinetSystemInfo {
  filename?: string;
  basename?: string;
  relativePath?: string;
}

export interface CabinetTechnicalDetail {
  __typename?: string;
  key?: string | null;
  value?: string | null;
  _content_source?: unknown;
}

export interface CabinetMediaItem {
  __typename?: string;
  file?: string | null;
  roomPriority?: boolean | null;
  paintPriority?: boolean | null;
  stainPriority?: boolean | null;
  countertopPriority?: boolean | null;
  flooring?: boolean | null;
  room?: string | null;
  cabinetPaints?: Array<string | null> | null;
  cabinetStains?: Array<string | null> | null;
  countertop?: string | null;
  label?: string | null;
  description?: string | null;
  _content_source?: unknown;
}

export interface CabinetReferenceProduct {
  __typename?: string;
  _sys?: CabinetSystemInfo | null;
  id?: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  doorStyle?: string | null;
  paint?: string | null;
  stainType?: string | null;
  description?: string | null;
  picture?: string | null;
  _content_source?: unknown;
}

export interface CabinetRelatedProduct {
  __typename?: string;
  product?: CabinetReferenceProduct | string | null;
  _content_source?: unknown;
}

export interface CabinetData {
  __typename?: string;
  _sys?: CabinetSystemInfo | null;
  id?: string;
  published?: boolean | null;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  doorStyle?: string | null;
  paint?: string | null;
  stainType?: string | null;
  description?: string | null;
  picture?: string | null;
  relatedProjects?: Array<string | null> | null;
  relatedProducts?: Array<CabinetRelatedProduct | null> | null;
  technicalDetails?: Array<CabinetTechnicalDetail | null> | null;
  media?: Array<CabinetMediaItem | null> | null;
  sourceId?: number | null;
  sourceUpdatedAt?: string | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface CabinetQueryLikeResult {
  data: { cabinet?: CabinetData | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CabinetListItem {
  filename: string;
  slug: string;
  name: string;
  code: string;
  picture: string;
  doorStyle?: string;
  paint?: string;
  stainType?: string;
}

export interface CabinetGalleryItem {
  file: string;
  sourceType: "picture" | "media";
  source?: CabinetMediaItem;
}

export interface CabinetProjectItem {
  file: string;
  title: string;
  href?: string;
  selectionIndex?: number;
  source?: CabinetMediaItem;
  projectSource?: Record<string, unknown>;
  mediaSource?: Record<string, unknown>;
  isMock?: boolean;
}

export interface CabinetRelatedItem {
  slug: string;
  name: string;
  code?: string;
  image?: string;
  relation?: CabinetRelatedProduct;
}

export interface CabinetPageSettingsBlock {
  __typename?: string | null;
  _template?: string | null;
  [key: string]: unknown;
}

export interface CabinetPageSettings {
  __typename?: string;
  id?: string;
  _sys?: CabinetSystemInfo | null;
  _content_source?: unknown;
  blocks?: Array<CabinetPageSettingsBlock | null> | null;
}

export interface CabinetPageSettingsQueryLikeResult {
  data: { cabinetPageSettings?: CabinetPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CabinetPageTextConfig {
  breadcrumbLabel: string;
  technicalDetailsTitle: string;
  contactButtonLabel: string;
  descriptionLabel: string;
  relatedProductsTitle: string;
  projectsSectionTitle: string;
  projectsSectionDescription: string;
}
