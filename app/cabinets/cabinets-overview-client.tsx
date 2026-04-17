"use client";
import { useTina } from "tinacms/dist/react";
import FigmaCabinetsOverviewPage from "@/components/cabinets-overview/FigmaCabinetsOverviewPage";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
}

function TinaCabinetsOverviewClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  const page = (data as { page?: Record<string, unknown> }).page;

  return <FigmaCabinetsOverviewPage page={page || {}} />;
}

export default function CabinetsOverviewClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    const page = (props.data as { page?: Record<string, unknown> }).page;
    return <FigmaCabinetsOverviewPage page={page || {}} />;
  }

  return <TinaCabinetsOverviewClient {...props} />;
}
