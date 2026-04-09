import type {
  CatalogSettingsData,
  CatalogSystemInfo,
  CatalogVisualOption,
} from "@/components/cabinets-overview/types";

export type { CatalogSettingsData, CatalogSystemInfo, CatalogVisualOption };

export interface FlooringOverviewItem {
  __typename?: string;
  _sys?: CatalogSystemInfo | null;
  id?: string;
  published?: boolean | null;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  flooringType?: string | null;
  description?: string | null;
  picture?: string | null;
  sourceUpdatedAt?: string | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface FlooringOverviewEdge {
  node?: FlooringOverviewItem | null;
}

export interface FlooringOverviewDataShape {
  catalogSettings?: CatalogSettingsData | null;
  flooringConnection?: {
    edges?: Array<FlooringOverviewEdge | null> | null;
  } | null;
}

export interface FlooringOverviewQueryLikeResult {
  data: FlooringOverviewDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}
