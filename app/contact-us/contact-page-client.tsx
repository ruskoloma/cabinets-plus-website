"use client";

import { useTina } from "tinacms/dist/react";
import { resolveTemplateName, toBlockArray, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";

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
            contactMode="formAndShowroom"
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

  return renderSections(toBlockArray(data.page?.blocks));
}

export default function ContactPageClient(props: ContactPageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return renderSections(toBlockArray(props.data?.page?.blocks));
  }

  return <TinaContactPageClient {...props} />;
}
