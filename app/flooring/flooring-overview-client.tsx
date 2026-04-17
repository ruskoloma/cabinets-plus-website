"use client";
import { useTina } from "tinacms/dist/react";
import FigmaFlooringOverviewPage from "@/components/flooring-overview/FigmaFlooringOverviewPage";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
}

function TinaFlooringOverviewClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  const page = (data as { page?: Record<string, unknown> }).page;

  return <FigmaFlooringOverviewPage page={page || {}} />;
}

export default function FlooringOverviewClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    const page = (props.data as { page?: Record<string, unknown> }).page;
    return <FigmaFlooringOverviewPage page={page || {}} />;
  }

  return <TinaFlooringOverviewClient {...props} />;
}
