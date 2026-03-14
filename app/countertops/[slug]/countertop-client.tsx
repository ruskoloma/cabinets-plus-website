"use client";

import { tinaField, useEditState, useTina } from "tinacms/dist/react";
import { COUNTERTOP_LIVE_QUERY } from "@/app/countertop-live-query";
import CountertopDetailPage from "@/components/countertop/CountertopDetailPage";
import {
  buildCountertopGalleryItems,
  buildCountertopProjectItems,
  buildMockProjectItems,
  buildRelatedCountertopItems,
  getAdjacentCountertops,
  getCountertopSlug,
  resolveCountertopPageText,
  sortTechnicalDetails,
} from "@/components/countertop/helpers";
import { normalizeCountertopQueryData } from "@/components/countertop/normalize-countertop-query";
import type {
  CabinetPageSettings,
  CountertopData,
  CountertopListItem,
  ProductTechnicalDetailViewModel,
} from "@/components/countertop/types";
import { normalizeGalleryOverviewQueryData } from "@/components/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewQueryLikeResult } from "@/components/gallery-overview/types";

interface CountertopDataShape {
  countertop?: CountertopData | null;
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

interface CountertopDetailClientProps {
  data: CountertopDataShape;
  query?: string;
  variables?: Record<string, unknown>;
  countertopIndex: CountertopListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettings?: CabinetPageSettings | null;
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

function CountertopRenderer({
  data,
  countertopIndex,
  currentSlug,
  contactBlock,
  galleryOverviewData,
  pageSettings,
}: {
  data: CountertopDataShape;
  countertopIndex: CountertopListItem[];
  currentSlug: string;
  contactBlock?: Record<string, unknown> | null;
  galleryOverviewData: GalleryOverviewQueryLikeResult["data"];
  pageSettings?: CabinetPageSettings | null;
}) {
  const countertop = data.countertop;
  if (!countertop) return null;

  const resolvedSlug = getCountertopSlug(countertop, currentSlug);
  const pageText = resolveCountertopPageText(pageSettings);
  const galleryItems = buildCountertopGalleryItems(countertop);
  const technicalDetails: ProductTechnicalDetailViewModel[] = sortTechnicalDetails(countertop.technicalDetails).map((detail) => ({
    key: detail.key,
    value: detail.value,
    unit: detail.unit,
    keyTinaField: tinaField(detail as unknown as Record<string, unknown>, "key") || undefined,
    valueTinaField: tinaField(detail as unknown as Record<string, unknown>, "value") || undefined,
  }));
  const projectItemsFromData = buildCountertopProjectItems(countertop, galleryOverviewData, {
    fallbackTitle: pageText.projectFallbackTitle,
  });
  const projectItems = projectItemsFromData.length ? projectItemsFromData : buildMockProjectItems(countertop, pageSettings);
  const relatedItems = buildRelatedCountertopItems(countertop, countertopIndex, resolvedSlug);
  const adjacent = getAdjacentCountertops(countertopIndex, resolvedSlug);

  return (
    <CountertopDetailPage
      contactBlock={contactBlock || null}
      countertop={countertop}
      currentSlug={resolvedSlug}
      galleryItems={galleryItems}
      nextProduct={adjacent.next}
      pageText={pageText}
      previousProduct={adjacent.previous}
      projectItems={projectItems}
      relatedItems={relatedItems}
      technicalDetails={technicalDetails}
    />
  );
}

function StaticCountertopDetailPage({
  data,
  countertopIndex,
  currentSlug,
  homePageData,
  galleryOverviewData,
  pageSettings,
}: {
  data: CountertopDataShape;
  countertopIndex: CountertopListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettings?: CabinetPageSettings | null;
}) {
  const contactBlock = extractContactBlock(homePageData.data);

  return (
    <CountertopRenderer
      contactBlock={contactBlock}
      countertopIndex={countertopIndex}
      currentSlug={currentSlug}
      data={data}
      galleryOverviewData={galleryOverviewData.data}
      pageSettings={pageSettings}
    />
  );
}

function TinaCountertopDetailPageWithSupportingData(props: {
  data: CountertopDataShape;
  query: string;
  variables: Record<string, unknown>;
  countertopIndex: CountertopListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettings?: CabinetPageSettings | null;
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

  const normalized = normalizeCountertopQueryData(tinaData, `${props.currentSlug}.md`);
  const homeData = homeQuery ? homeTinaData : props.homePageData.data;
  const normalizedGallery = galleryQuery
    ? normalizeGalleryOverviewQueryData(galleryTinaData)
    : props.galleryOverviewData.data;
  const contactBlock = extractContactBlock(homeData);

  return (
    <CountertopRenderer
      contactBlock={contactBlock}
      countertopIndex={props.countertopIndex}
      currentSlug={props.currentSlug}
      data={normalized}
      galleryOverviewData={normalizedGallery}
      pageSettings={props.pageSettings}
    />
  );
}

export default function CountertopDetailClient(props: CountertopDetailClientProps) {
  const { edit } = useEditState();
  const hasQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasQuery && !edit) {
    return (
      <StaticCountertopDetailPage
        countertopIndex={props.countertopIndex}
        currentSlug={props.currentSlug}
        data={props.data}
        galleryOverviewData={props.galleryOverviewData}
        homePageData={props.homePageData}
        pageSettings={props.pageSettings}
      />
    );
  }

  const liveQuery = props.query?.trim() || COUNTERTOP_LIVE_QUERY;
  const liveVariables = props.query?.trim() ? (props.variables || {}) : { relativePath: `${props.currentSlug}.md` };

  return (
    <TinaCountertopDetailPageWithSupportingData
      countertopIndex={props.countertopIndex}
      currentSlug={props.currentSlug}
      data={props.data}
      galleryOverviewData={props.galleryOverviewData}
      homePageData={props.homePageData}
      pageSettings={props.pageSettings}
      query={liveQuery}
      variables={liveVariables}
    />
  );
}
