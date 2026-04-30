"use client";

import { useTina } from "tinacms/dist/react";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";

interface PrivacyPolicyClientProps {
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
            key={`privacy-policy-block-${template || "unknown"}-${index}`}
            template={template}
          />
        );
      })}
    </div>
  );
}

function TinaPrivacyPolicyClient(props: PrivacyPolicyClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });
  const blocks = useResolvedSharedSectionBlocks(data.page?.blocks);

  return renderSections(blocks);
}

export default function PrivacyPolicyClient(props: PrivacyPolicyClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <StaticPrivacyPolicyClient blocks={props.data?.page?.blocks} />;
  }

  return <TinaPrivacyPolicyClient {...props} />;
}

function StaticPrivacyPolicyClient({ blocks }: { blocks: unknown }) {
  const resolvedBlocks = useResolvedSharedSectionBlocks(blocks);
  return renderSections(resolvedBlocks);
}
