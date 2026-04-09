"use client";

import { tinaField, useEditState, useTina } from "tinacms/dist/react";
import { FLOORING_LIVE_QUERY } from "@/app/flooring-live-query";
import FlooringDetailPage from "@/components/flooring/FlooringDetailPage";
import {
  buildFlooringGalleryItems,
  buildFlooringProjectItems,
  buildRelatedFlooringItems,
  getAdjacentFloorings,
  getFlooringSlug,
  resolveFlooringPageText,
  sortTechnicalDetails,
} from "@/components/flooring/helpers";
import { normalizeFlooringQueryData } from "@/components/flooring/normalize-flooring-query";
import type {
  FlooringPageSettings,
  FlooringPageSettingsQueryLikeResult,
  FlooringData,
  FlooringListItem,
  ProductTechnicalDetailViewModel,
} from "@/components/flooring/types";
import { normalizeGalleryOverviewQueryData } from "@/components/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewQueryLikeResult } from "@/components/gallery-overview/types";

interface FlooringDataShape {
  flooring?: FlooringData | null;
}

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

interface FlooringDetailClientProps {
  data: FlooringDataShape;
  query?: string;
  variables?: Record<string, unknown>;
  flooringIndex: FlooringListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: FlooringPageSettingsQueryLikeResult;
}

function extractContactBlock(pageData: unknown): Record<string, unknown> | null {
  if (!pageData || typeof pageData !== "object") return null;
  const page = pageData as { page?: { blocks?: unknown[] | null } | null };
  const blocks = Array.isArray(page.page?.blocks) ? page.page?.blocks : [];

  const found = blocks.find((block) => {
    if (!block || typeof block !== "object") return false;
    const typed = block as { __typename?: string; _template?: string };
    return typed.__typename === "PageBlocksContactSection" || typed._template === "contactSection";
  });

  return found && typeof found === "object" ? (found as Record<string, unknown>) : null;
}

function FlooringRenderer({
  data,
  flooringIndex,
  currentSlug,
  contactBlock,
  galleryOverviewData,
  pageSettings,
  pageSettingsRecord,
}: {
  data: FlooringDataShape;
  flooringIndex: FlooringListItem[];
  currentSlug: string;
  contactBlock?: Record<string, unknown> | null;
  galleryOverviewData: GalleryOverviewQueryLikeResult["data"];
  pageSettings?: FlooringPageSettings | null;
  pageSettingsRecord?: Record<string, unknown> | null;
}) {
  const flooring = data.flooring;
  if (!flooring) return null;

  const resolvedSlug = getFlooringSlug(flooring, currentSlug);
  const pageText = resolveFlooringPageText(pageSettings);
  const galleryItems = buildFlooringGalleryItems(flooring);
  const technicalDetails: ProductTechnicalDetailViewModel[] = sortTechnicalDetails(flooring.technicalDetails).map((detail) => ({
    key: detail.key,
    value: detail.value,
    unit: detail.unit,
    keyTinaField: tinaField(detail as unknown as Record<string, unknown>, "key") || undefined,
    valueTinaField: tinaField(detail as unknown as Record<string, unknown>, "value") || undefined,
  }));
  const projectItems = buildFlooringProjectItems(flooring, galleryOverviewData);
  const relatedItems = buildRelatedFlooringItems(flooring, flooringIndex, resolvedSlug);
  const adjacent = getAdjacentFloorings(flooringIndex, resolvedSlug);

  return (
    <FlooringDetailPage
      contactBlock={contactBlock || null}
      flooring={flooring}
      currentSlug={resolvedSlug}
      galleryItems={galleryItems}
      galleryLightboxImageSize={pageSettings?.galleryLightboxImageSize ?? null}
      galleryMainImageSize={pageSettings?.galleryMainImageSize ?? null}
      galleryThumbImageSize={pageSettings?.galleryThumbImageSize ?? null}
      nextProduct={adjacent.next}
      pageText={pageText}
      previousProduct={adjacent.previous}
      projectItems={projectItems}
      relatedItems={relatedItems}
      technicalDetails={technicalDetails}
      pageSettingsRecord={pageSettingsRecord}
      projectsSectionImageSize={pageSettings?.projectsSectionImageSize ?? null}
      relatedProductsImageSize={pageSettings?.relatedProductsImageSize ?? null}
    />
  );
}

function StaticFlooringDetailPage({
  data,
  flooringIndex,
  currentSlug,
  homePageData,
  galleryOverviewData,
  pageSettingsData,
}: {
  data: FlooringDataShape;
  flooringIndex: FlooringListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: FlooringPageSettingsQueryLikeResult;
}) {
  const contactBlock = extractContactBlock(homePageData.data);
  const pageSettings = pageSettingsData.data.flooringPageSettings || null;

  return (
    <FlooringRenderer
      contactBlock={contactBlock}
      flooringIndex={flooringIndex}
      currentSlug={currentSlug}
      data={data}
      galleryOverviewData={galleryOverviewData.data}
      pageSettings={pageSettings}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

function TinaFlooringDetailPageWithSupportingData(props: {
  data: FlooringDataShape;
  query: string;
  variables: Record<string, unknown>;
  flooringIndex: FlooringListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: FlooringPageSettingsQueryLikeResult;
}) {
  const homeQuery = props.homePageData.query?.trim() || "";
  const homeVariables = props.homePageData.variables || {};
  const galleryQuery = props.galleryOverviewData.query?.trim() || "";
  const galleryVariables = props.galleryOverviewData.variables || {};

  const { data: tinaData } = useTina({
    data: props.data,
    query: props.query,
    variables: props.variables,
  });
  const { data: homeTinaData } = useTina({
    data: props.homePageData.data,
    query: homeQuery,
    variables: homeVariables,
  });
  const { data: galleryTinaData } = useTina({
    data: props.galleryOverviewData.data,
    query: galleryQuery,
    variables: galleryVariables,
  });
  const pageSettingsQuery = props.pageSettingsData.query?.trim() || "";
  const pageSettingsVariables = props.pageSettingsData.variables || {};
  const { data: pageSettingsTinaData } = useTina({
    data: props.pageSettingsData.data,
    query: pageSettingsQuery,
    variables: pageSettingsVariables,
  });

  const normalized = normalizeFlooringQueryData(tinaData, `${props.currentSlug}.md`);
  const homeData = homeQuery ? homeTinaData : props.homePageData.data;
  const normalizedGallery = galleryQuery
    ? normalizeGalleryOverviewQueryData(galleryTinaData)
    : props.galleryOverviewData.data;
  const contactBlock = extractContactBlock(homeData);
  const pageSettings = pageSettingsQuery
    ? pageSettingsTinaData.flooringPageSettings || props.pageSettingsData.data.flooringPageSettings
    : props.pageSettingsData.data.flooringPageSettings;

  return (
    <FlooringRenderer
      contactBlock={contactBlock}
      flooringIndex={props.flooringIndex}
      currentSlug={props.currentSlug}
      data={normalized}
      galleryOverviewData={normalizedGallery}
      pageSettings={pageSettings || null}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

export default function FlooringDetailClient(props: FlooringDetailClientProps) {
  const { edit } = useEditState();
  const hasQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasQuery && !edit) {
    return (
      <StaticFlooringDetailPage
        flooringIndex={props.flooringIndex}
        currentSlug={props.currentSlug}
        data={props.data}
        galleryOverviewData={props.galleryOverviewData}
        homePageData={props.homePageData}
        pageSettingsData={props.pageSettingsData}
      />
    );
  }

  const liveQuery = props.query?.trim() || FLOORING_LIVE_QUERY;
  const liveVariables = props.query?.trim() ? (props.variables || {}) : { relativePath: `${props.currentSlug}.md` };

  return (
    <TinaFlooringDetailPageWithSupportingData
      flooringIndex={props.flooringIndex}
      currentSlug={props.currentSlug}
      data={props.data}
      galleryOverviewData={props.galleryOverviewData}
      homePageData={props.homePageData}
      pageSettingsData={props.pageSettingsData}
      query={liveQuery}
      variables={liveVariables}
    />
  );
}
