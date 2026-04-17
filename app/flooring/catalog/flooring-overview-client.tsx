"use client";

import { useTina } from "tinacms/dist/react";
import FlooringOverviewPage from "@/components/flooring-overview/FlooringOverviewPage";
import { normalizeFlooringOverviewQueryData } from "@/components/flooring-overview/normalize-flooring-overview-query";
import { FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { FlooringOverviewPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { FLOORING_OVERVIEW_QUERY } from "@/components/flooring-overview/queries";
import type { FlooringOverviewQueryLikeResult } from "@/components/flooring-overview/types";

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

function FlooringOverviewRenderer({
  overviewData,
  pageSettingsData,
}: {
  overviewData: unknown;
  pageSettingsData?: FlooringOverviewPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeFlooringOverviewQueryData(overviewData);
  const pageSettings = pageSettingsData?.flooringOverviewPageSettings || null;

  return (
    <FlooringOverviewPage
      data={normalized}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

function TinaOverviewRenderer(props: FlooringOverviewClientProps & { overviewQuery: string; settingsQuery: string }) {
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
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

export default function FlooringOverviewClient(props: FlooringOverviewClientProps) {
  // homePageData is retained for backward compatibility with the page wrapper but is no longer consumed.
  const overviewQuery = props.overviewData.query?.trim() || FLOORING_OVERVIEW_QUERY;
  const settingsQuery = props.pageSettingsData.query?.trim() || FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY;

  return <TinaOverviewRenderer {...props} overviewQuery={overviewQuery} settingsQuery={settingsQuery} />;
}
