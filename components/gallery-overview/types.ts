import type {
  CatalogSettingsData,
  CatalogSystemInfo,
  CatalogVisualOption,
} from "@/components/cabinets-overview/types";

export type { CatalogSettingsData, CatalogSystemInfo, CatalogVisualOption };

export interface ProjectMediaItem {
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
  raw?: Record<string, unknown>;
}

export interface ProjectOverviewItem {
  __typename?: string;
  _sys?: CatalogSystemInfo | null;
  id?: string;
  title?: string | null;
  slug?: string | null;
  address?: string | null;
  description?: string | null;
  notes?: string | null;
  primaryPicture?: string | null;
  relatedProjects?: Array<string | null> | null;
  sourceUpdatedAt?: string | null;
  media?: Array<ProjectMediaItem | null> | null;
  _content_source?: unknown;
  _values?: unknown;
}

export interface GalleryOverviewDataShape {
  catalogSettings?: CatalogSettingsData | null;
  projectConnection?: {
    edges?: Array<{ node?: ProjectOverviewItem | null } | null> | null;
  } | null;
}

export interface GalleryOverviewQueryLikeResult {
  data: GalleryOverviewDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}

export interface GalleryProjectItemData {
  rawProject: Record<string, unknown>;
  projectSlug: string;
  projectTitle: string;
  coverImage: string;
  media: GalleryProjectMediaData[];
  rooms: string[];
  paints: string[];
  stains: string[];
  countertops: string[];
  flooring: boolean;
  doorStyle: string;
  updatedAt: number;
}

export interface GalleryProjectMediaData {
  rawMedia: Record<string, unknown>;
  file: string;
  room: string;
  paints: string[];
  stains: string[];
  finishes: string[];
  countertop: string;
  flooring: boolean;
  roomPriority: boolean;
  paintPriority: boolean;
  stainPriority: boolean;
  countertopPriority: boolean;
  label: string;
  description: string;
  order: number;
}
