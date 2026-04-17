export interface SettingsSystemInfo {
  filename?: string;
  basename?: string;
  relativePath?: string;
}

interface BaseSettingsDocument {
  __typename?: string;
  id?: string;
  _sys?: SettingsSystemInfo | null;
  _content_source?: unknown;
}

export interface CatalogPageSettingsBlock {
  __typename?: string | null;
  _template?: string | null;
  [key: string]: unknown;
}

export interface CabinetsOverviewPageSettings extends BaseSettingsDocument {
  blocks?: Array<CatalogPageSettingsBlock | null> | null;
}

export interface CountertopsOverviewPageSettings extends BaseSettingsDocument {
  blocks?: Array<CatalogPageSettingsBlock | null> | null;
}

export interface FlooringOverviewPageSettings extends BaseSettingsDocument {
  blocks?: Array<CatalogPageSettingsBlock | null> | null;
}

export interface GalleryPageSettings extends BaseSettingsDocument {
  pageTitle?: string | null;
  galleryOverviewProjectCardImageSize?: string | null;
  galleryOverviewFilterImageSize?: string | null;
}

export interface ProjectPageSettings extends BaseSettingsDocument {
  projectDetailMaterialsTitle?: string | null;
  projectDetailRelatedProjectsTitle?: string | null;
  projectDetailRelatedProjectsCtaLabel?: string | null;
  projectDetailMaterialCardImageSize?: string | null;
  projectDetailGalleryImageSize?: string | null;
  projectDetailLightboxImageSize?: string | null;
  projectDetailRelatedProjectsImageSize?: string | null;
}

export interface PostPageSettings extends BaseSettingsDocument {
  postBreadcrumbLabel?: string | null;
  postRelatedArticlesTitle?: string | null;
  postDetailThumbnailImageSize?: string | null;
  postDetailRelatedArticlesImageSize?: string | null;
}

export interface CabinetsOverviewPageSettingsQueryLikeResult {
  data: { cabinetsOverviewPageSettings?: CabinetsOverviewPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CountertopsOverviewPageSettingsQueryLikeResult {
  data: { countertopsOverviewPageSettings?: CountertopsOverviewPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface FlooringOverviewPageSettingsQueryLikeResult {
  data: { flooringOverviewPageSettings?: FlooringOverviewPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface GalleryPageSettingsQueryLikeResult {
  data: { galleryPageSettings?: GalleryPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface ProjectPageSettingsQueryLikeResult {
  data: { projectPageSettings?: ProjectPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface PostPageSettingsQueryLikeResult {
  data: { postPageSettings?: PostPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export const FALLBACK_CABINETS_OVERVIEW_PAGE_SETTINGS: CabinetsOverviewPageSettings = {
  blocks: [
    { _template: "cabinetCatalogGrid", pageTitle: "Cabinets", cardImageSize: "card", filterImageSize: "thumb" },
  ],
};

export const FALLBACK_COUNTERTOPS_OVERVIEW_PAGE_SETTINGS: CountertopsOverviewPageSettings = {
  blocks: [
    { _template: "countertopCatalogGrid", pageTitle: "Countertops", cardImageSize: "card", filterImageSize: "thumb" },
  ],
};

export const FALLBACK_FLOORING_OVERVIEW_PAGE_SETTINGS: FlooringOverviewPageSettings = {
  blocks: [
    { _template: "flooringCatalogGrid", pageTitle: "Flooring Catalog", cardImageSize: "card", filterImageSize: "thumb" },
  ],
};

export const FALLBACK_GALLERY_PAGE_SETTINGS: GalleryPageSettings = {
  pageTitle: "Gallery",
  galleryOverviewProjectCardImageSize: "card",
  galleryOverviewFilterImageSize: "thumb",
};

export const FALLBACK_PROJECT_PAGE_SETTINGS: ProjectPageSettings = {
  projectDetailMaterialsTitle: "Finish & Materials",
  projectDetailRelatedProjectsTitle: "Projects You Might Like",
  projectDetailRelatedProjectsCtaLabel: "View all",
  projectDetailMaterialCardImageSize: "thumb",
  projectDetailGalleryImageSize: "card",
  projectDetailLightboxImageSize: "full",
  projectDetailRelatedProjectsImageSize: "card",
};

export const FALLBACK_POST_PAGE_SETTINGS: PostPageSettings = {
  postBreadcrumbLabel: "Articles",
  postRelatedArticlesTitle: "Related articles",
  postDetailThumbnailImageSize: "feature",
  postDetailRelatedArticlesImageSize: "card",
};
