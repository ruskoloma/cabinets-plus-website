"use client";

import { useTina } from "tinacms/dist/react";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";

interface ContactPageClientProps {
  data: { page?: { blocks?: unknown[] | null } | null };
  query?: string;
  variables?: Record<string, unknown>;
}

function renderSections(blocks: HomeBlock[]) {
  return (
    <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;

        return (
          <SharedPageSectionRenderer
            block={blockRecord}
            key={`contact-block-${template || "unknown"}-${index}`}
            template={template}
          />
        );
      })}
    </div>
  );
}

function TinaContactPageClient(props: ContactPageClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });
  const blocks = useResolvedSharedSectionBlocks(data.page?.blocks);

  return renderSections(blocks);
}

export default function ContactPageClient(props: ContactPageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <StaticContactPageClient blocks={props.data?.page?.blocks} />;
  }

  return <TinaContactPageClient {...props} />;
}

function StaticContactPageClient({ blocks }: { blocks: unknown }) {
  const resolvedBlocks = useResolvedSharedSectionBlocks(blocks);
  return renderSections(resolvedBlocks);
}
