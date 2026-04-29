"use client";
import { useTina } from "tinacms/dist/react";
import FigmaCountertopsOverviewPage from "@/components/special/countertops-overview/FigmaCountertopsOverviewPage";
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
  const body = hasLiveQuery ? (
    <TinaCountertopsOverviewClient {...props} />
  ) : (
    <FigmaCountertopsOverviewPage page={getPageRecord(props.data)} />
  );

  return <RelatedPostsProvider posts={props.posts}>{body}</RelatedPostsProvider>;
}
