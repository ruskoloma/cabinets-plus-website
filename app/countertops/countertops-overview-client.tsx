"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import CountertopsOverviewPage from "@/components/countertops-overview/CountertopsOverviewPage";
import { normalizeCountertopsOverviewQueryData } from "@/components/countertops-overview/normalize-countertops-overview-query";
import { COUNTERTOPS_OVERVIEW_QUERY } from "@/components/countertops-overview/queries";
import type { CountertopsOverviewQueryLikeResult } from "@/components/countertops-overview/types";

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
}: {
  overviewData: unknown;
  homePageData: HomePageDataShape;
}) {
  const normalized = normalizeCountertopsOverviewQueryData(overviewData);
  const faqBlock = extractHomeBlock(homePageData, { typename: "PageBlocksFaqSection", template: "faqSection" });
  const contactBlock = extractHomeBlock(homePageData, {
    typename: "PageBlocksContactSection",
    template: "contactSection",
  });

  return (
    <CountertopsOverviewPage
      contactBlock={contactBlock}
      data={normalized}
      faqBlock={faqBlock}
    />
  );
}

function TinaOverviewWithStaticHome(props: CountertopsOverviewClientProps & { overviewQuery: string }) {
  const overview = useTina({
    data: props.overviewData.data,
    query: props.overviewQuery,
    variables: props.overviewData.variables || {},
  });

  return (
    <CountertopsOverviewRenderer
      homePageData={props.homePageData.data}
      overviewData={overview.data}
    />
  );
}

function TinaOverviewWithLiveHome(props: CountertopsOverviewClientProps & { overviewQuery: string; homeQuery: string }) {
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

  return (
    <CountertopsOverviewRenderer
      homePageData={home.data}
      overviewData={overview.data}
    />
  );
}

export default function CountertopsOverviewClient(props: CountertopsOverviewClientProps) {
  const { edit } = useEditState();
  const overviewQuery = props.overviewData.query?.trim() || COUNTERTOPS_OVERVIEW_QUERY;
  const homeQuery = props.homePageData.query?.trim() || "";
  const hasHomeLiveQuery = Boolean(homeQuery);
  const hasOverviewLiveQuery = Boolean(props.overviewData.query?.trim());

  if (!hasOverviewLiveQuery && !edit) {
    return <TinaOverviewWithStaticHome {...props} overviewQuery={overviewQuery} />;
  }

  if (!hasHomeLiveQuery) {
    return <TinaOverviewWithStaticHome {...props} overviewQuery={overviewQuery} />;
  }

  return <TinaOverviewWithLiveHome {...props} homeQuery={homeQuery} overviewQuery={overviewQuery} />;
}
