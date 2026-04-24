"use client";
import { useTina } from "tinacms/dist/react";
import FigmaCountertopsOverviewPage from "@/components/special/countertops-overview/FigmaCountertopsOverviewPage";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
}

function getPageRecord(data: Record<string, unknown>) {
  const page =
    (data as { countertopsMainPageSettings?: unknown }).countertopsMainPageSettings ??
    (data as { page?: unknown }).page;

  return page && typeof page === "object" ? (page as Record<string, unknown>) : {};
}

function TinaCountertopsOverviewClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  return <FigmaCountertopsOverviewPage page={getPageRecord(data as Record<string, unknown>)} />;
}

export default function CountertopsOverviewClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <FigmaCountertopsOverviewPage page={getPageRecord(props.data)} />;
  }

  return <TinaCountertopsOverviewClient {...props} />;
}
