"use client";

import { useEditState, useTina } from "tinacms/dist/react";
import { GALLERY_OVERVIEW_QUERY } from "@/components/special/gallery-overview/queries";
import type { GalleryOverviewQueryLikeResult } from "@/components/special/gallery-overview/types";
import { normalizeGalleryOverviewQueryData } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import { COLLECTION_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { CollectionPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import CollectionDetailPage from "@/components/special/collection-detail/CollectionDetailPage";
import { normalizeCollectionQueryData } from "@/components/special/collection-detail/normalize-collection-query";
import type { CollectionDetailQueryLikeResult } from "@/components/special/collection-detail/types";
import { COLLECTION_LIVE_QUERY } from "@/app/collection-live-query";

interface HomePageDataShape {
  page?: {
    blocks?: unknown[] | null;
  } | null;
}

interface HomePageQueryLikeResult {
  data: HomePageDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}

interface CollectionDetailClientProps {
  currentSlug: string;
  collectionData: CollectionDetailQueryLikeResult;
  overviewData: GalleryOverviewQueryLikeResult;
  homePageData: HomePageQueryLikeResult;
  pageSettingsData: CollectionPageSettingsQueryLikeResult;
}

// Tina returns the document under the `specialityCollection` GraphQL field name;
// re-key it to `collection` so the normalizer (and the rest of the app) can stay
// collection-flavored.
function rekeyLiveCollectionData(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.collection !== undefined) return record;
  if (record.specialityCollection !== undefined) {
    return { ...record, collection: record.specialityCollection };
  }
  return record;
}

function extractContactBlock(pageData: unknown): Record<string, unknown> | null {
  if (!pageData || typeof pageData !== "object") return null;

  const page = pageData as { page?: { blocks?: unknown[] | null } | null };
  const blocks = Array.isArray(page.page?.blocks) ? page.page.blocks : [];

  const found = blocks.find((block) => {
    if (!block || typeof block !== "object") return false;
    const typed = block as { __typename?: string; _template?: string };
    return typed.__typename === "PageBlocksContactSection" || typed._template === "contactSection";
  });

  return found && typeof found === "object" ? (found as Record<string, unknown>) : null;
}

function CollectionDetailRenderer({
  collectionData,
  overviewData,
  homePageData,
  pageSettingsData,
}: CollectionDetailClientProps) {
  const collection = collectionData.data.collection;
  if (!collection) return null;

  const normalizedOverview = normalizeGalleryOverviewQueryData(overviewData.data);
  const contactBlock = extractContactBlock(homePageData.data);
  const pageSettings = pageSettingsData.data.collectionPageSettings || null;

  return (
    <CollectionDetailPage
      collection={collection}
      contactBlock={contactBlock}
      overviewData={normalizedOverview}
      pageSettingsRecord={
        pageSettings && typeof pageSettings === "object"
          ? (pageSettings as Record<string, unknown>)
          : null
      }
    />
  );
}

function TinaCollectionDetailClient(props: CollectionDetailClientProps) {
  const collectionQuery = props.collectionData.query?.trim() || COLLECTION_LIVE_QUERY;
  const collectionVariables = props.collectionData.query?.trim()
    ? (props.collectionData.variables || {})
    : { relativePath: `${props.currentSlug}.md` };
  const overviewQuery = props.overviewData.query?.trim() || GALLERY_OVERVIEW_QUERY;
  const homeQuery = props.homePageData.query?.trim() || "";
  const pageSettingsQuery = props.pageSettingsData.query?.trim() || COLLECTION_PAGE_SETTINGS_QUERY;

  const { data: collectionData } = useTina({
    data: props.collectionData.data,
    query: collectionQuery,
    variables: collectionVariables,
  });

  const { data: overviewData } = useTina({
    data: props.overviewData.data,
    query: overviewQuery,
    variables: props.overviewData.variables || {},
  });

  const { data: homePageData } = useTina({
    data: props.homePageData.data,
    query: homeQuery,
    variables: props.homePageData.variables || {},
  });
  const { data: pageSettingsData } = useTina({
    data: props.pageSettingsData.data,
    query: pageSettingsQuery,
    variables: props.pageSettingsData.variables || {},
  });

  return (
    <CollectionDetailRenderer
      currentSlug={props.currentSlug}
      homePageData={{
        ...props.homePageData,
        data: homeQuery ? homePageData : props.homePageData.data,
      }}
      pageSettingsData={{
        ...props.pageSettingsData,
        data: pageSettingsQuery ? pageSettingsData : props.pageSettingsData.data,
      }}
      overviewData={{
        ...props.overviewData,
        data: normalizeGalleryOverviewQueryData(overviewData),
      }}
      collectionData={{
        ...props.collectionData,
        data: normalizeCollectionQueryData(rekeyLiveCollectionData(collectionData), `${props.currentSlug}.md`),
      }}
    />
  );
}

export default function CollectionClient(props: CollectionDetailClientProps) {
  const { edit } = useEditState();
  const hasLiveCollectionQuery = Boolean(props.collectionData.query && props.collectionData.query.trim().length > 0);

  if (!hasLiveCollectionQuery && !edit) {
    return <CollectionDetailRenderer {...props} />;
  }

  return <TinaCollectionDetailClient {...props} />;
}
