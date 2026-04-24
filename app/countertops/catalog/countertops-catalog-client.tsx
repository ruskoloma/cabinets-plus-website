"use client";

import { useTina } from "tinacms/dist/react";
import CountertopsOverviewPage from "@/components/special/countertops-overview/CountertopsOverviewPage";
import { normalizeCountertopsOverviewQueryData } from "@/components/special/countertops-overview/normalize-countertops-overview-query";
import { COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { CountertopsOverviewPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { COUNTERTOPS_OVERVIEW_QUERY } from "@/components/special/countertops-overview/queries";
import type { CountertopsOverviewQueryLikeResult } from "@/components/special/countertops-overview/types";

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

function CountertopsOverviewRenderer({
  overviewData,
  pageSettingsData,
}: {
  overviewData: unknown;
  pageSettingsData?: CountertopsOverviewPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeCountertopsOverviewQueryData(overviewData);
  const pageSettings = pageSettingsData?.countertopsOverviewPageSettings || null;

  return (
    <CountertopsOverviewPage
      data={normalized}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

function TinaOverviewRenderer(props: CountertopsOverviewClientProps & { overviewQuery: string; settingsQuery: string }) {
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
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

export default function CountertopsCatalogClient(props: CountertopsOverviewClientProps) {
  // homePageData is retained for backward compatibility with the page wrapper but is no longer consumed.
  const overviewQuery = props.overviewData.query?.trim() || COUNTERTOPS_OVERVIEW_QUERY;
  const settingsQuery = props.pageSettingsData.query?.trim() || COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY;

  return <TinaOverviewRenderer {...props} overviewQuery={overviewQuery} settingsQuery={settingsQuery} />;
}
