"use client";
import { useTina } from "tinacms/dist/react";
import FigmaFlooringOverviewPage from "@/components/special/flooring-overview/FigmaFlooringOverviewPage";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
}

function getPageRecord(data: Record<string, unknown>) {
  const page =
    (data as { flooringMainPageSettings?: unknown }).flooringMainPageSettings ??
    (data as { page?: unknown }).page;

  return page && typeof page === "object" ? (page as Record<string, unknown>) : {};
}

function TinaFlooringOverviewClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  return <FigmaFlooringOverviewPage page={getPageRecord(data as Record<string, unknown>)} />;
}

export default function FlooringOverviewClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <FigmaFlooringOverviewPage page={getPageRecord(props.data)} />;
  }

  return <TinaFlooringOverviewClient {...props} />;
}
