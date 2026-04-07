import type {
  CatalogSettingsData,
  ProjectCabinetProductLink,
  ProjectCountertopProductLink,
  ProjectMediaItem,
  ProjectOverviewItem,
} from "@/components/gallery-overview/types";
import type { CabinetListItem } from "@/components/cabinet-door/types";
import type { CountertopListItem } from "@/components/countertop/types";

export type {
  CatalogSettingsData,
  ProjectCabinetProductLink,
  ProjectCountertopProductLink,
  ProjectMediaItem,
  ProjectOverviewItem,
  CabinetListItem,
  CountertopListItem,
};

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
  sourceType: "media";
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
  focusItemId?: string;
  focusListKey?: string;
}

export interface ProjectRelatedCardData {
  slug: string;
  title: string;
  image: string;
  tinaField?: string;
  focusItemId?: string;
  focusListKey?: string;
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
  pageSettingsRecord?: Record<string, unknown> | null;
  materialsTitle?: string | null;
  relatedProjectsTitle?: string | null;
  relatedProjectsCtaLabel?: string | null;
  contactBlock?: Record<string, unknown> | null;
  materialCardImageSizeChoice?: string | null;
  galleryImageSizeChoice?: string | null;
  lightboxImageSizeChoice?: string | null;
  relatedProjectsImageSizeChoice?: string | null;
}
