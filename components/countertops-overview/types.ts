import type {
  CatalogSettingsData,
  CatalogSystemInfo,
  CatalogVisualOption,
} from "@/components/cabinets-overview/types";

export type { CatalogSettingsData, CatalogSystemInfo, CatalogVisualOption };

export interface CountertopOverviewItem {
  __typename?: string;
  _sys?: CatalogSystemInfo | null;
  id?: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  countertopType?: string | null;
  description?: string | null;
  picture?: string | null;
  sourceUpdatedAt?: string | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface CountertopsOverviewEdge {
  node?: CountertopOverviewItem | null;
}

export interface CountertopsOverviewDataShape {
  catalogSettings?: CatalogSettingsData | null;
  countertopConnection?: {
    edges?: Array<CountertopsOverviewEdge | null> | null;
  } | null;
}

export interface CountertopsOverviewQueryLikeResult {
  data: CountertopsOverviewDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}
