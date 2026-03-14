export interface CatalogSystemInfo {
  filename?: string;
  basename?: string;
  relativePath?: string;
}

export interface CatalogVisualOption {
  value: string;
  label: string;
  image?: string | null;
  swatchColor?: string | null;
  _content_source?: unknown;
}

export interface CatalogSettingsData {
  _sys?: CatalogSystemInfo | null;
  id?: string;
  doorStyles: CatalogVisualOption[];
  paintOptions: CatalogVisualOption[];
  stainTypes: CatalogVisualOption[];
  rooms: string[];
  countertopTypes: CatalogVisualOption[];
  _content_source?: unknown;
  _values?: unknown;
}

export interface CabinetOverviewItem {
  __typename?: string;
  _sys?: CatalogSystemInfo | null;
  id?: string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
  doorStyle?: string | null;
  paint?: string | null;
  stainType?: string | null;
  description?: string | null;
  picture?: string | null;
  sourceUpdatedAt?: string | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface CabinetsOverviewEdge {
  node?: CabinetOverviewItem | null;
}

export interface CabinetsOverviewDataShape {
  catalogSettings?: CatalogSettingsData | null;
  cabinetConnection?: {
    edges?: Array<CabinetsOverviewEdge | null> | null;
  } | null;
}

export interface CabinetsOverviewQueryLikeResult {
  data: CabinetsOverviewDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}
