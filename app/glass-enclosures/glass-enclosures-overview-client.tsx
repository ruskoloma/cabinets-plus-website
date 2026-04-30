"use client";
import { useTina } from "tinacms/dist/react";
import FigmaCabinetsOverviewPage from "@/components/special/cabinets-overview/FigmaCabinetsOverviewPage";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
}

function getPageRecord(data: Record<string, unknown>) {
  const page =
    (data as { glassEnclosuresMainPageSettings?: unknown }).glassEnclosuresMainPageSettings ??
    (data as { page?: unknown }).page;

  return page && typeof page === "object" ? (page as Record<string, unknown>) : {};
}

function TinaGlassEnclosuresOverviewClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  return <FigmaCabinetsOverviewPage page={getPageRecord(data as Record<string, unknown>)} />;
}

export default function GlassEnclosuresOverviewClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <FigmaCabinetsOverviewPage page={getPageRecord(props.data)} />;
  }

  return <TinaGlassEnclosuresOverviewClient {...props} />;
}
