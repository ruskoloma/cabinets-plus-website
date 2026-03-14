"use client";
import { useTina } from "tinacms/dist/react";
import { asBlockArray, type BlockRecord } from "@/components/blocks/block-types";
import BlockRenderer from "@/components/blocks/BlockRenderer";

interface ServiceDataShape {
  service?: {
    blocks?: unknown[] | null;
  } | null;
}

interface ServicePageClientProps {
  data: ServiceDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}

function getBlocks(data: ServiceDataShape): BlockRecord[] {
  return asBlockArray(data.service?.blocks);
}

function StaticServicePage({ data }: { data: ServiceDataShape }) {
  return <BlockRenderer blocks={getBlocks(data)} />;
}

function TinaServicePage(props: {
  data: ServiceDataShape;
  query: string;
  variables: Record<string, unknown>;
}) {
  const { data } = useTina(props);
  return <BlockRenderer blocks={getBlocks(data)} />;
}

export default function ServicePageClient(props: ServicePageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);
  if (!hasLiveQuery) {
    return <StaticServicePage data={props.data} />;
  }

  return <TinaServicePage data={props.data} query={props.query || ""} variables={props.variables || {}} />;
}
