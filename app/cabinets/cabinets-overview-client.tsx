"use client";
import { useTina } from "tinacms/dist/react";
import FigmaCabinetsOverviewPage from "@/components/special/cabinets-overview/FigmaCabinetsOverviewPage";
import { RelatedPostsProvider } from "@/components/sections/related-posts-context";
import type { PostConnectionNode } from "@/components/special/post-detail/types";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
  posts?: PostConnectionNode[];
}

function getPageRecord(data: Record<string, unknown>) {
  const page =
    (data as { cabinetsMainPageSettings?: unknown }).cabinetsMainPageSettings ??
    (data as { page?: unknown }).page;

  return page && typeof page === "object" ? (page as Record<string, unknown>) : {};
}

function TinaCabinetsOverviewClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  return <FigmaCabinetsOverviewPage page={getPageRecord(data as Record<string, unknown>)} />;
}

export default function CabinetsOverviewClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);
  const body = hasLiveQuery ? (
    <TinaCabinetsOverviewClient {...props} />
  ) : (
    <FigmaCabinetsOverviewPage page={getPageRecord(props.data)} />
  );

  return <RelatedPostsProvider posts={props.posts}>{body}</RelatedPostsProvider>;
}
