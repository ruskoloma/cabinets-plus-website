"use client";

import { useTina } from "tinacms/dist/react";
import { resolveTemplateName, toBlockArray, type HomeBlock } from "@/app/figma-home.helpers";
import AboutHeroSection from "@/components/about/AboutHeroSection";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";

interface AboutPageClientProps {
  data: { page?: { blocks?: unknown[] | null } | null };
  query?: string;
  variables?: Record<string, unknown>;
}

function renderBlock(block: HomeBlock, index: number) {
  const template = resolveTemplateName(block);
  const blockRecord = block as Record<string, unknown>;
  const key = `about-block-${template || "unknown"}-${index}`;

  switch (template) {
    case "hero":
      return <AboutHeroSection block={blockRecord} key={key} />;
    default:
      return (
        <SharedPageSectionRenderer
          block={blockRecord}
          key={key}
          template={template}
        />
      );
  }
}

function renderPage(blocks: ReturnType<typeof toBlockArray>) {
  return <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">{blocks.map(renderBlock)}</div>;
}

function TinaAboutPageClient(props: AboutPageClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });
  const blocks = useResolvedSharedSectionBlocks(data.page?.blocks);

  return renderPage(blocks);
}

export default function AboutPageClient(props: AboutPageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <StaticAboutPageClient blocks={props.data?.page?.blocks} />;
  }

  return <TinaAboutPageClient {...props} />;
}

function StaticAboutPageClient({ blocks }: { blocks: unknown }) {
  const resolvedBlocks = useResolvedSharedSectionBlocks(blocks);
  return renderPage(resolvedBlocks);
}
