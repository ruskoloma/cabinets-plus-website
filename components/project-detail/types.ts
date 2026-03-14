import type {
  CatalogSettingsData,
  ProjectMediaItem,
  ProjectOverviewItem,
} from "@/components/gallery-overview/types";
import type { CabinetListItem } from "@/components/cabinet-door/types";

export type { CatalogSettingsData, ProjectMediaItem, ProjectOverviewItem, CabinetListItem };

export interface ProjectDetailQueryLikeResult {
  data: {
    project?: ProjectOverviewItem | null;
  };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface ProjectGalleryItem {
  file: string;
  alt: string;
  sourceType: "primaryPicture" | "media";
  source?: ProjectMediaItem;
}

export interface ProjectMaterialCardData {
  kind: "cabinet" | "countertop" | "flooring";
  label: string;
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
  tinaField?: string;
}

export interface ProjectRelatedCardData {
  slug: string;
  title: string;
  image: string;
  tinaField?: string;
}

export interface ProjectFeatureSummary {
  rooms: string[];
  paints: string[];
  stains: string[];
  countertops: string[];
  flooring: boolean;
  doorStyle: string;
}

export interface ProjectDetailPageProps {
  project: ProjectOverviewItem;
  galleryItems: ProjectGalleryItem[];
  materialCards: ProjectMaterialCardData[];
  relatedProjects: ProjectRelatedCardData[];
  contactBlock?: Record<string, unknown> | null;
}
