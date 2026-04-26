import type {
  CollectionMediaSummary,
  CollectionOverviewItem,
  GalleryOverviewDataShape,
} from "@/components/special/gallery-overview/types";

export type { CollectionMediaSummary, CollectionOverviewItem, GalleryOverviewDataShape };

export interface CollectionDetailQueryLikeResult {
  data: {
    collection?: CollectionOverviewItem | null;
  };
  query?: string;
  variables?: Record<string, unknown>;
}

export interface CollectionGalleryItem {
  file: string;
  alt: string;
  sourceType: "media";
  source?: CollectionMediaSummary;
}

export interface CollectionRelatedProjectCardData {
  slug: string;
  title: string;
  image: string;
  tinaField?: string;
  focusItemId?: string;
  focusListKey?: string;
}

export interface CollectionDetailPageProps {
  collection: CollectionOverviewItem;
  overviewData: GalleryOverviewDataShape;
  pageSettingsRecord?: Record<string, unknown> | null;
  contactBlock?: Record<string, unknown> | null;
}
