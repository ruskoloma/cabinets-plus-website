"use client";

import { useTina } from "tinacms/dist/react";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { asBlockArray, enrichBlocksWithSharedData, type SharedSectionsData } from "@/components/blocks/block-types";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
  sharedSections?: SharedSectionsData | null;
}

function TinaPageClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  const page = (data as { page?: Record<string, unknown> }).page;
  const blocks = enrichBlocksWithSharedData(
    asBlockArray(page?.blocks),
    props.sharedSections,
  );

  return (
    <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">
      <BlockRenderer blocks={blocks} />
    </div>
  );
}

export default function PageClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    const page = (props.data as { page?: Record<string, unknown> }).page;
    const blocks = enrichBlocksWithSharedData(
      asBlockArray(page?.blocks),
      props.sharedSections,
    );
    return (
      <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">
        <BlockRenderer blocks={blocks} />
      </div>
    );
  }

  return <TinaPageClient {...props} />;
}
