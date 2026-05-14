import type {
  CatalogSettingsData,
  GalleryOverviewDataShape,
  ProjectCabinetProductLink,
  ProjectCountertopProductLink,
  ProjectFlooringProductLink,
  ProjectMediaItem,
  ProjectOverviewItem,
} from "@/components/special/gallery-overview/types";
import type { CabinetListItem } from "@/components/special/cabinet-door/types";
import type { CountertopListItem } from "@/components/special/countertop/types";
import type { FlooringListItem } from "@/components/special/flooring/types";

export type {
  CatalogSettingsData,
  GalleryOverviewDataShape,
  ProjectCabinetProductLink,
  ProjectCountertopProductLink,
  ProjectFlooringProductLink,
  ProjectMediaItem,
  ProjectOverviewItem,
  CabinetListItem,
  CountertopListItem,
  FlooringListItem,
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
  doorStyles: string[];
  doorStyle: string;
}

export interface ProjectDetailPageProps {
  project: ProjectOverviewItem;
  cabinetIndex: CabinetListItem[];
  countertopIndex: CountertopListItem[];
  flooringIndex: FlooringListItem[];
  overviewData: GalleryOverviewDataShape;
  pageSettingsRecord?: Record<string, unknown> | null;
  contactBlock?: Record<string, unknown> | null;
}
