"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import type { PageQueryLikeResult } from "@/app/get-page-data-safe";
import GalleryOverviewPage from "@/components/gallery-overview/GalleryOverviewPage";
import { normalizeGalleryOverviewQueryData } from "@/components/gallery-overview/normalize-gallery-overview-query";
import { GALLERY_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { GalleryPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { GALLERY_OVERVIEW_QUERY } from "@/components/gallery-overview/queries";
import type { GalleryOverviewQueryLikeResult } from "@/components/gallery-overview/types";

interface GalleryOverviewClientProps {
  homePageData: PageQueryLikeResult;
  overviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: GalleryPageSettingsQueryLikeResult;
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
  pageSettingsData,
}: {
  homePageData: unknown;
  overviewData: unknown;
  pageSettingsData?: GalleryPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeGalleryOverviewQueryData(overviewData);
  const contactBlock = extractHomeBlock(homePageData, {
    typename: "PageBlocksContactSection",
    template: "contactSection",
  });
  const pageSettings = pageSettingsData?.galleryPageSettings || null;

  return (
    <GalleryOverviewPage
      contactBlock={contactBlock}
      data={normalized}
      filterImageSizeChoice={pageSettings?.galleryOverviewFilterImageSize}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
      pageTitle={pageSettings?.pageTitle || "Gallery"}
      projectCardImageSizeChoice={pageSettings?.galleryOverviewProjectCardImageSize}
    />
  );
}

function TinaGalleryOverview({
  homePageData,
  homeQuery,
  overviewData,
  overviewQuery,
  pageSettingsData,
  settingsQuery,
}: GalleryOverviewClientProps & {
  homeQuery?: string;
  overviewQuery: string;
  settingsQuery: string;
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
  const liveSettings = useTina({
    data: pageSettingsData.data,
    query: settingsQuery,
    variables: pageSettingsData.variables || {},
  });

  return <GalleryOverviewRenderer homePageData={liveHome.data} overviewData={liveOverview.data} pageSettingsData={liveSettings.data} />;
}

export default function GalleryOverviewClient({ homePageData, overviewData, pageSettingsData }: GalleryOverviewClientProps) {
  const { edit } = useEditState();
  const overviewQuery = overviewData.query?.trim() || GALLERY_OVERVIEW_QUERY;
  const hasLiveQuery = Boolean(overviewData.query?.trim());
  const homeQuery = homePageData.query?.trim() || "";
  const settingsQuery = pageSettingsData.query?.trim() || GALLERY_PAGE_SETTINGS_QUERY;

  if (!hasLiveQuery && !homeQuery && !edit) {
    return <GalleryOverviewRenderer homePageData={homePageData.data} overviewData={overviewData.data} pageSettingsData={pageSettingsData.data} />;
  }

  if (!homeQuery) {
    return <GalleryOverviewRenderer homePageData={homePageData.data} overviewData={overviewData.data} pageSettingsData={pageSettingsData.data} />;
  }

  return (
    <TinaGalleryOverview
      homePageData={homePageData}
      homeQuery={homeQuery}
      overviewData={overviewData}
      overviewQuery={overviewQuery}
      pageSettingsData={pageSettingsData}
      settingsQuery={settingsQuery}
    />
  );
}
