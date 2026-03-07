"use client";
import { useTina } from "tinacms/dist/react";
import BlockRenderer from "@/components/blocks/BlockRenderer";

interface GenericPageClientProps {
  data: { page?: { blocks?: unknown[] | null } | null };
  query?: string;
  variables?: Record<string, unknown>;
}

function TinaGenericPageClient(props: GenericPageClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });
  return <BlockRenderer blocks={data.page?.blocks || []} />;
}

// Shared client component for any page collection document (about-us, contact-us, etc.)
export default function GenericPageClient(props: GenericPageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <BlockRenderer blocks={props.data?.page?.blocks || []} />;
  }

  return <TinaGenericPageClient {...props} />;
}
