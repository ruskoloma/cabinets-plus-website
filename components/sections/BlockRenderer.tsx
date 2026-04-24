"use client";

import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import type { BlockRecord } from "./block-types";

export default function BlockRenderer({ blocks }: { blocks: BlockRecord[] }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((block, i) => {
        const template = resolveTemplateName(block as HomeBlock);
        if (!template) {
          console.warn(`No component found for block type: ${block.__typename || block._template || "unknown"}`);
          return null;
        }
        return <SharedPageSectionRenderer block={block} key={i} template={template} />;
      })}
    </>
  );
}
