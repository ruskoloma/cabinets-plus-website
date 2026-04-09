"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import FlooringOverviewPage from "@/components/flooring-overview/FlooringOverviewPage";
import { normalizeFlooringOverviewQueryData } from "@/components/flooring-overview/normalize-flooring-overview-query";
import { FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { FlooringOverviewPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { FLOORING_OVERVIEW_QUERY } from "@/components/flooring-overview/queries";
import type { FlooringOverviewQueryLikeResult } from "@/components/flooring-overview/types";
import { normalizeImageSizeChoice } from "@/lib/image-size-controls";

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

interface FlooringOverviewClientProps {
  overviewData: FlooringOverviewQueryLikeResult;
  homePageData: HomePageQueryLikeResult;
  pageSettingsData: FlooringOverviewPageSettingsQueryLikeResult;
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

function FlooringOverviewRenderer({
  overviewData,
  homePageData,
  pageSettingsData,
}: {
  overviewData: unknown;
  homePageData: HomePageDataShape;
  pageSettingsData?: FlooringOverviewPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeFlooringOverviewQueryData(overviewData);
  const aboutBlock = extractHomeBlock(homePageData, { typename: "PageBlocksAboutSection", template: "aboutSection" });
  const pageSettings = pageSettingsData?.flooringOverviewPageSettings || null;

  return (
    <FlooringOverviewPage
      aboutBlock={aboutBlock}
      cardImageSizeChoice={normalizeImageSizeChoice(pageSettings?.flooringOverviewCardImageSize, "card")}
      data={normalized}
      filterImageSizeChoice={normalizeImageSizeChoice(pageSettings?.flooringOverviewFilterImageSize, "thumb")}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
      pageTitle={pageSettings?.pageTitle || "Flooring Catalog"}
    />
  );
}

function TinaOverviewWithStaticHome(props: FlooringOverviewClientProps & { overviewQuery: string; settingsQuery: string }) {
  const overview = useTina({
    data: props.overviewData.data,
    query: props.overviewQuery,
    variables: props.overviewData.variables || {},
  });
  const pageSettings = useTina({
    data: props.pageSettingsData.data,
    query: props.settingsQuery,
    variables: props.pageSettingsData.variables || {},
  });

  return (
    <FlooringOverviewRenderer
      homePageData={props.homePageData.data}
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

function TinaOverviewWithLiveHome(props: FlooringOverviewClientProps & { overviewQuery: string; homeQuery: string; settingsQuery: string }) {
  const overview = useTina({
    data: props.overviewData.data,
    query: props.overviewQuery,
    variables: props.overviewData.variables || {},
  });

  const home = useTina({
    data: props.homePageData.data,
    query: props.homeQuery,
    variables: props.homePageData.variables || {},
  });
  const pageSettings = useTina({
    data: props.pageSettingsData.data,
    query: props.settingsQuery,
    variables: props.pageSettingsData.variables || {},
  });

  return (
    <FlooringOverviewRenderer
      homePageData={home.data}
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

export default function FlooringOverviewClient(props: FlooringOverviewClientProps) {
  const { edit } = useEditState();
  const overviewQuery = props.overviewData.query?.trim() || FLOORING_OVERVIEW_QUERY;
  const homeQuery = props.homePageData.query?.trim() || "";
  const settingsQuery = props.pageSettingsData.query?.trim() || FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY;
  const hasHomeLiveQuery = Boolean(homeQuery);
  const hasOverviewLiveQuery = Boolean(props.overviewData.query?.trim());

  if (!hasOverviewLiveQuery && !edit) {
    return <TinaOverviewWithStaticHome {...props} overviewQuery={overviewQuery} settingsQuery={settingsQuery} />;
  }

  if (!hasHomeLiveQuery) {
    return <TinaOverviewWithStaticHome {...props} overviewQuery={overviewQuery} settingsQuery={settingsQuery} />;
  }

  return <TinaOverviewWithLiveHome {...props} homeQuery={homeQuery} overviewQuery={overviewQuery} settingsQuery={settingsQuery} />;
}
