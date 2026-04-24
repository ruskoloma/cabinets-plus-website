"use client";

import { useEditState, useTina } from "tinacms/dist/react";
import CabinetDoorPage from "@/components/special/cabinet-door/CabinetDoorPage";
import { normalizeCabinetQueryData } from "@/components/special/cabinet-door/normalize-cabinet-query";
import { CABINET_LIVE_QUERY } from "@/app/cabinet-live-query";
import {
  buildGalleryItems,
  buildProjectItems,
  buildRelatedItems,
  getAdjacentCabinets,
  getCabinetSlug,
  resolveCabinetPageText,
  sortTechnicalDetails,
} from "@/components/special/cabinet-door/helpers";
import type {
  CabinetData,
  CabinetListItem,
  CabinetPageSettings,
  CabinetPageSettingsQueryLikeResult,
} from "@/components/special/cabinet-door/types";
import { normalizeGalleryOverviewQueryData } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewQueryLikeResult } from "@/components/special/gallery-overview/types";

interface CabinetDataShape {
  cabinet?: CabinetData | null;
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

interface CabinetDetailClientProps {
  data: CabinetDataShape;
  query?: string;
  variables?: Record<string, unknown>;
  cabinetIndex: CabinetListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: CabinetPageSettingsQueryLikeResult;
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

function CabinetDoorRenderer({
  data,
  cabinetIndex,
  currentSlug,
  contactBlock,
  galleryOverviewData,
  pageSettings,
  pageSettingsRecord,
}: {
  data: CabinetDataShape;
  cabinetIndex: CabinetListItem[];
  currentSlug: string;
  contactBlock?: Record<string, unknown> | null;
  galleryOverviewData: GalleryOverviewQueryLikeResult["data"];
  pageSettings?: CabinetPageSettings | null;
  pageSettingsRecord?: Record<string, unknown> | null;
}) {
  const cabinet = data.cabinet;
  if (!cabinet) return null;

  const resolvedSlug = getCabinetSlug(cabinet, currentSlug);
  const pageText = resolveCabinetPageText(pageSettings);
  const galleryItems = buildGalleryItems(cabinet);
  const technicalDetails = sortTechnicalDetails(cabinet.technicalDetails);
  const projectItems = buildProjectItems(cabinet, galleryOverviewData);
  const relatedItems = buildRelatedItems(cabinet, cabinetIndex, resolvedSlug);
  const adjacent = getAdjacentCabinets(cabinetIndex, resolvedSlug);

  return (
    <CabinetDoorPage
      cabinet={cabinet}
      currentSlug={resolvedSlug}
      galleryItems={galleryItems}
      nextProduct={adjacent.next}
      previousProduct={adjacent.previous}
      projectItems={projectItems}
      relatedItems={relatedItems}
      technicalDetails={technicalDetails}
      pageText={pageText}
      contactBlock={contactBlock || null}
      pageSettingsRecord={pageSettingsRecord}
    />
  );
}

function StaticCabinetDetailPage({
  data,
  cabinetIndex,
  currentSlug,
  homePageData,
  galleryOverviewData,
  pageSettingsData,
}: {
  data: CabinetDataShape;
  cabinetIndex: CabinetListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: CabinetPageSettingsQueryLikeResult;
}) {
  const contactBlock = extractContactBlock(homePageData.data);
  const pageSettings = pageSettingsData.data.cabinetPageSettings || null;
  return (
    <CabinetDoorRenderer
      cabinetIndex={cabinetIndex}
      contactBlock={contactBlock}
      currentSlug={currentSlug}
      data={data}
      galleryOverviewData={galleryOverviewData.data}
      pageSettings={pageSettings}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

function TinaCabinetDetailPageWithHome(props: {
  data: CabinetDataShape;
  query: string;
  variables: Record<string, unknown>;
  cabinetIndex: CabinetListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  galleryOverviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: CabinetPageSettingsQueryLikeResult;
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
  const normalized = normalizeCabinetQueryData(tinaData, `${props.currentSlug}.md`);
  const homeData = homeQuery ? homeTinaData : props.homePageData.data;
  const normalizedGallery = galleryQuery
    ? normalizeGalleryOverviewQueryData(galleryTinaData)
    : props.galleryOverviewData.data;
  const contactBlock = extractContactBlock(homeData);
  const pageSettings = pageSettingsQuery
    ? pageSettingsTinaData.cabinetPageSettings || props.pageSettingsData.data.cabinetPageSettings
    : props.pageSettingsData.data.cabinetPageSettings;

  return (
    <CabinetDoorRenderer
      cabinetIndex={props.cabinetIndex}
      contactBlock={contactBlock}
      currentSlug={props.currentSlug}
      data={normalized}
      galleryOverviewData={normalizedGallery}
      pageSettings={pageSettings || null}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

export default function CabinetDetailClient(props: CabinetDetailClientProps) {
  const { edit } = useEditState();
  const hasQuery = Boolean(props.query && props.query.trim().length > 0);
  if (!hasQuery && !edit) {
    return (
      <StaticCabinetDetailPage
        cabinetIndex={props.cabinetIndex}
        currentSlug={props.currentSlug}
        data={props.data}
        galleryOverviewData={props.galleryOverviewData}
        homePageData={props.homePageData}
        pageSettingsData={props.pageSettingsData}
      />
    );
  }

  const liveQuery = props.query?.trim() || CABINET_LIVE_QUERY;
  const liveVariables = props.query?.trim() ? (props.variables || {}) : { relativePath: `${props.currentSlug}.md` };
  return (
    <TinaCabinetDetailPageWithHome
      cabinetIndex={props.cabinetIndex}
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
