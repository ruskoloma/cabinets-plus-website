"use client";

import { useEditState, useTina } from "tinacms/dist/react";
import CabinetDoorPage from "@/components/cabinet-door/CabinetDoorPage";
import { normalizeCabinetQueryData } from "@/components/cabinet-door/normalize-cabinet-query";
import { CABINET_LIVE_QUERY } from "@/app/cabinet-live-query";
import {
  buildGalleryItems,
  buildMockProjectItems,
  buildProjectItems,
  buildRelatedItems,
  getAdjacentCabinets,
  getCabinetSlug,
  resolveCabinetPageText,
  sortTechnicalDetails,
} from "@/components/cabinet-door/helpers";
import type { CabinetData, CabinetListItem, CabinetPageSettings } from "@/components/cabinet-door/types";

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

function CabinetDoorRenderer({
  data,
  cabinetIndex,
  currentSlug,
  contactBlock,
  pageSettings,
}: {
  data: CabinetDataShape;
  cabinetIndex: CabinetListItem[];
  currentSlug: string;
  contactBlock?: Record<string, unknown> | null;
  pageSettings?: CabinetPageSettings | null;
}) {
  const cabinet = data.cabinet;
  if (!cabinet) return null;

  const resolvedSlug = getCabinetSlug(cabinet, currentSlug);
  const pageText = resolveCabinetPageText(pageSettings);
  const galleryItems = buildGalleryItems(cabinet);
  const technicalDetails = sortTechnicalDetails(cabinet.technicalDetails);
  const projectItemsFromData = buildProjectItems(cabinet, { fallbackTitle: pageText.projectFallbackTitle });
  const projectItems = projectItemsFromData.length ? projectItemsFromData : buildMockProjectItems(cabinet, pageSettings);
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
    />
  );
}

function StaticCabinetDetailPage({
  data,
  cabinetIndex,
  currentSlug,
  homePageData,
  pageSettings,
}: {
  data: CabinetDataShape;
  cabinetIndex: CabinetListItem[];
  currentSlug: string;
  homePageData: HomePageQueryLikeResult;
  pageSettings?: CabinetPageSettings | null;
}) {
  const contactBlock = extractContactBlock(homePageData.data);
  return (
    <CabinetDoorRenderer
      cabinetIndex={cabinetIndex}
      contactBlock={contactBlock}
      currentSlug={currentSlug}
      data={data}
      pageSettings={pageSettings}
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
  pageSettings?: CabinetPageSettings | null;
}) {
  const homeQuery = props.homePageData.query?.trim() || "";
  const homeVariables = props.homePageData.variables || {};
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
  const normalized = normalizeCabinetQueryData(tinaData, `${props.currentSlug}.md`);
  const homeData = homeQuery ? homeTinaData : props.homePageData.data;
  const contactBlock = extractContactBlock(homeData);

  return (
    <CabinetDoorRenderer
      cabinetIndex={props.cabinetIndex}
      contactBlock={contactBlock}
      currentSlug={props.currentSlug}
      data={normalized}
      pageSettings={props.pageSettings}
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
        homePageData={props.homePageData}
        pageSettings={props.pageSettings}
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
      homePageData={props.homePageData}
      pageSettings={props.pageSettings}
      query={liveQuery}
      variables={liveVariables}
    />
  );
}
