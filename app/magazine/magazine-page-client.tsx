"use client";

import { useTina } from "tinacms/dist/react";
import { resolveTemplateName, toBlockArray, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";

interface MagazinePageClientProps {
  data: { page?: { blocks?: unknown[] | null } | null };
  query?: string;
  variables?: Record<string, unknown>;
}

function renderBlock(block: HomeBlock, index: number) {
  const template = resolveTemplateName(block);
  const blockRecord = block as Record<string, unknown>;
  const key = `magazine-block-${template || "unknown"}-${index}`;

  return (
    <SharedPageSectionRenderer
      block={blockRecord}
      key={key}
      template={template}
    />
  );
}

function renderPage(blocks: ReturnType<typeof toBlockArray>) {
  return <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">{blocks.map(renderBlock)}</div>;
}

function TinaMagazinePageClient(props: MagazinePageClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });
  const blocks = useResolvedSharedSectionBlocks(data.page?.blocks);
  return renderPage(blocks);
}

function StaticMagazinePageClient({ blocks }: { blocks: unknown }) {
  const resolvedBlocks = useResolvedSharedSectionBlocks(blocks);
  return renderPage(resolvedBlocks);
}

export default function MagazinePageClient(props: MagazinePageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <StaticMagazinePageClient blocks={props.data?.page?.blocks} />;
  }

  return <TinaMagazinePageClient {...props} />;
}
