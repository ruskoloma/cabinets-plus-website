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

export interface SettingsSeo {
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
}

export interface ServiceMainPageSettings extends BaseSettingsDocument {
  title?: string | null;
  seo?: SettingsSeo | null;
  blocks?: Array<CatalogPageSettingsBlock | null> | null;
}

export type CabinetsMainPageSettings = ServiceMainPageSettings;
export type CountertopsMainPageSettings = ServiceMainPageSettings;
export type FlooringMainPageSettings = ServiceMainPageSettings;

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
  title?: string | null;
  seo?: SettingsSeo | null;
  blocks?: Array<CatalogPageSettingsBlock | null> | null;
}

export interface ProjectPageSettings extends BaseSettingsDocument {
  blocks?: Array<CatalogPageSettingsBlock | null> | null;
}

export interface PostPageSettings extends BaseSettingsDocument {
  postBreadcrumbLabel?: string | null;
  postRelatedArticlesTitle?: string | null;
  postDetailThumbnailImageSize?: string | null;
  postDetailRelatedArticlesImageSize?: string | null;
}

export interface CabinetsMainPageSettingsQueryLikeResult {
  data: { cabinetsMainPageSettings?: CabinetsMainPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CountertopsMainPageSettingsQueryLikeResult {
  data: { countertopsMainPageSettings?: CountertopsMainPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface FlooringMainPageSettingsQueryLikeResult {
  data: { flooringMainPageSettings?: FlooringMainPageSettings | null };
  query?: string;
  variables?: Record<string, unknown>;
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

export const FALLBACK_CABINETS_MAIN_PAGE_SETTINGS: CabinetsMainPageSettings = {
  title: "Cabinets",
  blocks: [],
};

export const FALLBACK_COUNTERTOPS_MAIN_PAGE_SETTINGS: CountertopsMainPageSettings = {
  title: "Countertops",
  blocks: [],
};

export const FALLBACK_FLOORING_MAIN_PAGE_SETTINGS: FlooringMainPageSettings = {
  title: "Flooring",
  blocks: [],
};

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
  title: "Gallery",
  seo: {
    description: "Browse completed cabinet, bath, laundry, and interior projects from Cabinets Plus.",
  },
  blocks: [
    {
      _template: "galleryProjectGrid",
      pageTitle: "Gallery",
      galleryOverviewProjectCardImageSize: "card",
      galleryOverviewFilterImageSize: "thumb",
    },
    { _template: "sharedContactSection" },
    { _template: "sharedShowroomSection" },
  ],
};

export const FALLBACK_PROJECT_PAGE_SETTINGS: ProjectPageSettings = {
  blocks: [
    {
      _template: "projectInfo",
      breadcrumbLabel: "Gallery",
      breadcrumbLink: "/gallery",
      galleryImageSize: "card",
      lightboxImageSize: "full",
    },
    {
      _template: "projectMaterials",
      title: "Finish & Materials",
      cabinetTitle: "Cabinet door",
      cabinetPlaceholder: "/library/catalog/material-placeholder-cabinet.svg",
      countertopTitle: "Countertop",
      countertopPlaceholder: "/library/catalog/material-placeholder-countertop.svg",
      flooringTitle: "Flooring",
      flooringPlaceholder: "/library/catalog/material-placeholder-flooring.svg",
      imageSize: "thumb",
    },
    {
      _template: "projectRelatedProjects",
      title: "Projects You Might Like",
      ctaLabel: "View all",
      ctaLink: "/gallery",
      imageSize: "card",
    },
    { _template: "sharedContactSection" },
  ],
};

export const FALLBACK_POST_PAGE_SETTINGS: PostPageSettings = {
  postBreadcrumbLabel: "Articles",
  postRelatedArticlesTitle: "Related articles",
  postDetailThumbnailImageSize: "feature",
  postDetailRelatedArticlesImageSize: "card",
};
