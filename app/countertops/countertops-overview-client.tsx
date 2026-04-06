"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import CountertopsOverviewPage from "@/components/countertops-overview/CountertopsOverviewPage";
import { normalizeCountertopsOverviewQueryData } from "@/components/countertops-overview/normalize-countertops-overview-query";
import { COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { CountertopsOverviewPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { COUNTERTOPS_OVERVIEW_QUERY } from "@/components/countertops-overview/queries";
import type { CountertopsOverviewQueryLikeResult } from "@/components/countertops-overview/types";
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

interface CountertopsOverviewClientProps {
  overviewData: CountertopsOverviewQueryLikeResult;
  homePageData: HomePageQueryLikeResult;
  pageSettingsData: CountertopsOverviewPageSettingsQueryLikeResult;
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

function CountertopsOverviewRenderer({
  overviewData,
  homePageData,
  pageSettingsData,
}: {
  overviewData: unknown;
  homePageData: HomePageDataShape;
  pageSettingsData?: CountertopsOverviewPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeCountertopsOverviewQueryData(overviewData);
  const aboutBlock = extractHomeBlock(homePageData, { typename: "PageBlocksAboutSection", template: "aboutSection" });
  const pageSettings = pageSettingsData?.countertopsOverviewPageSettings || null;

  return (
    <CountertopsOverviewPage
      aboutBlock={aboutBlock}
      cardImageSizeChoice={normalizeImageSizeChoice(pageSettings?.countertopsOverviewCardImageSize, "card")}
      data={normalized}
      filterImageSizeChoice={normalizeImageSizeChoice(pageSettings?.countertopsOverviewFilterImageSize, "thumb")}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
      pageTitle={pageSettings?.pageTitle || "Countertops"}
    />
  );
}

function TinaOverviewWithStaticHome(props: CountertopsOverviewClientProps & { overviewQuery: string; settingsQuery: string }) {
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
    <CountertopsOverviewRenderer
      homePageData={props.homePageData.data}
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

function TinaOverviewWithLiveHome(props: CountertopsOverviewClientProps & { overviewQuery: string; homeQuery: string; settingsQuery: string }) {
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
    <CountertopsOverviewRenderer
      homePageData={home.data}
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

export default function CountertopsOverviewClient(props: CountertopsOverviewClientProps) {
  const { edit } = useEditState();
  const overviewQuery = props.overviewData.query?.trim() || COUNTERTOPS_OVERVIEW_QUERY;
  const homeQuery = props.homePageData.query?.trim() || "";
  const settingsQuery = props.pageSettingsData.query?.trim() || COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY;
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
