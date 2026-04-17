"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import CabinetsOverviewPage from "@/components/cabinets-overview/CabinetsOverviewPage";
import { normalizeCabinetsOverviewQueryData } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import { CABINETS_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { CabinetsOverviewPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { CABINETS_OVERVIEW_QUERY } from "@/components/cabinets-overview/queries";
import type { CabinetsOverviewQueryLikeResult } from "@/components/cabinets-overview/types";
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

interface CabinetsCatalogClientProps {
  overviewData: CabinetsOverviewQueryLikeResult;
  homePageData: HomePageQueryLikeResult;
  pageSettingsData: CabinetsOverviewPageSettingsQueryLikeResult;
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

function CabinetsCatalogRenderer({
  overviewData,
  homePageData,
  pageSettingsData,
}: {
  overviewData: unknown;
  homePageData: HomePageDataShape;
  pageSettingsData?: CabinetsOverviewPageSettingsQueryLikeResult["data"];
}) {
  const normalized = normalizeCabinetsOverviewQueryData(overviewData);
  const faqBlock = extractHomeBlock(homePageData, { typename: "PageBlocksFaqSection", template: "faqSection" });
  const contactBlock = extractHomeBlock(homePageData, {
    typename: "PageBlocksContactSection",
    template: "contactSection",
  });
  const pageSettings = pageSettingsData?.cabinetsOverviewPageSettings || null;

  return (
    <CabinetsOverviewPage
      cardImageSizeChoice={normalizeImageSizeChoice(pageSettings?.cabinetsOverviewCardImageSize, "card")}
      contactBlock={contactBlock}
      data={normalized}
      faqBlock={faqBlock}
      filterImageSizeChoice={normalizeImageSizeChoice(pageSettings?.cabinetsOverviewFilterImageSize, "thumb")}
      pageTitle={pageSettings?.pageTitle || "Cabinets"}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
    />
  );
}

function TinaOverviewWithStaticHome(props: CabinetsCatalogClientProps & { overviewQuery: string; settingsQuery: string }) {
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
      homePageData={props.homePageData.data}
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

function TinaOverviewWithLiveHome(props: CabinetsCatalogClientProps & { overviewQuery: string; homeQuery: string; settingsQuery: string }) {
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
    <CabinetsCatalogRenderer
      homePageData={home.data}
      overviewData={overview.data}
      pageSettingsData={pageSettings.data}
    />
  );
}

export default function CabinetsCatalogClient(props: CabinetsCatalogClientProps) {
  const { edit } = useEditState();
  const overviewQuery = props.overviewData.query?.trim() || CABINETS_OVERVIEW_QUERY;
  const homeQuery = props.homePageData.query?.trim() || "";
  const settingsQuery = props.pageSettingsData.query?.trim() || CABINETS_OVERVIEW_PAGE_SETTINGS_QUERY;
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
