"use client";

import { useTina } from "tinacms/dist/react";
import CabinetsOverviewPage from "@/components/cabinets-overview/CabinetsOverviewPage";
import { normalizeCabinetsOverviewQueryData } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import { CABINETS_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { CabinetsOverviewPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { CABINETS_OVERVIEW_QUERY } from "@/components/cabinets-overview/queries";
import type { CabinetsOverviewQueryLikeResult } from "@/components/cabinets-overview/types";

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

interface CabinetsCatalogClientProps {
  overviewData: CabinetsOverviewQueryLikeResult;
  homePageData: HomePageQueryLikeResult;
  pageSettingsData: CabinetsOverviewPageSettingsQueryLikeResult;
}

function CabinetsCatalogRenderer({
  overviewData,
  pageSettingsData,
}: {
  overviewData: unknown;
  pageSettingsData?: CabinetsOverviewPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeCabinetsOverviewQueryData(overviewData);
  const pageSettings = pageSettingsData?.cabinetsOverviewPageSettings || null;

  return (
    <CabinetsOverviewPage
      data={normalized}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

function TinaOverviewRenderer(props: CabinetsCatalogClientProps & { overviewQuery: string; settingsQuery: string }) {
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
    <CabinetsCatalogRenderer
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

export default function CabinetsCatalogClient(props: CabinetsCatalogClientProps) {
  // homePageData is retained for backward compatibility with the page wrapper but is no longer consumed.
  const overviewQuery = props.overviewData.query?.trim() || CABINETS_OVERVIEW_QUERY;
  const settingsQuery = props.pageSettingsData.query?.trim() || CABINETS_OVERVIEW_PAGE_SETTINGS_QUERY;

  return <TinaOverviewRenderer {...props} overviewQuery={overviewQuery} settingsQuery={settingsQuery} />;
}
