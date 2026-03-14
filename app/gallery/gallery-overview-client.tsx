"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import type { PageQueryLikeResult } from "@/app/get-page-data-safe";
import GalleryOverviewPage from "@/components/gallery-overview/GalleryOverviewPage";
import { normalizeGalleryOverviewQueryData } from "@/components/gallery-overview/normalize-gallery-overview-query";
import { GALLERY_OVERVIEW_QUERY } from "@/components/gallery-overview/queries";
import type { GalleryOverviewQueryLikeResult } from "@/components/gallery-overview/types";

interface GalleryOverviewClientProps {
  homePageData: PageQueryLikeResult;
  overviewData: GalleryOverviewQueryLikeResult;
}

function extractHomeBlock(
  pageData: unknown,
  options: { typename: string; template: string },
): Record<string, unknown> | null {
  if (!pageData || typeof pageData !== "object") return null;

  const page = pageData as { page?: { blocks?: unknown[] | null } | null };
  const blocks = Array.isArray(page.page?.blocks) ? page.page.blocks : [];

  const found = blocks.find((block) => {
    if (!block || typeof block !== "object") return false;
    const typed = block as { __typename?: string; _template?: string };
    return typed.__typename === options.typename || typed._template === options.template;
  });

  return found && typeof found === "object" ? (found as Record<string, unknown>) : null;
}

function GalleryOverviewRenderer({
  homePageData,
  overviewData,
}: {
  homePageData: unknown;
  overviewData: unknown;
}) {
  const normalized = normalizeGalleryOverviewQueryData(overviewData);
  const contactBlock = extractHomeBlock(homePageData, {
    typename: "PageBlocksContactSection",
    template: "contactSection",
  });

  return <GalleryOverviewPage contactBlock={contactBlock} data={normalized} />;
}

function TinaGalleryOverview({
  homePageData,
  homeQuery,
  overviewData,
  overviewQuery,
}: GalleryOverviewClientProps & {
  homeQuery?: string;
  overviewQuery: string;
}) {
  const liveOverview = useTina({
    data: overviewData.data,
    query: overviewQuery,
    variables: overviewData.variables || {},
  });

  const liveHome = useTina({
    data: homePageData.data,
    query: homeQuery || "",
    variables: homePageData.variables || {},
  });

  return <GalleryOverviewRenderer homePageData={liveHome.data} overviewData={liveOverview.data} />;
}

export default function GalleryOverviewClient({ homePageData, overviewData }: GalleryOverviewClientProps) {
  const { edit } = useEditState();
  const overviewQuery = overviewData.query?.trim() || GALLERY_OVERVIEW_QUERY;
  const hasLiveQuery = Boolean(overviewData.query?.trim());
  const homeQuery = homePageData.query?.trim() || "";

  if (!hasLiveQuery && !homeQuery && !edit) {
    return <GalleryOverviewRenderer homePageData={homePageData.data} overviewData={overviewData.data} />;
  }

  if (!homeQuery) {
    return <GalleryOverviewRenderer homePageData={homePageData.data} overviewData={overviewData.data} />;
  }

  return (
    <TinaGalleryOverview
      homePageData={homePageData}
      homeQuery={homeQuery}
      overviewData={overviewData}
      overviewQuery={overviewQuery}
    />
  );
}
