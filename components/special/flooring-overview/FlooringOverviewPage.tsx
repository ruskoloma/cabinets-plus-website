"use client";

import { tinaField } from "tinacms/dist/react";
import FlooringCatalogGridSection from "./FlooringCatalogGridSection";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";
import type { FlooringOverviewDataShape } from "./types";

interface FlooringOverviewPageProps {
  data: FlooringOverviewDataShape;
  pageSettingsRecord?: Record<string, unknown> | null;
}

const FLOORING_CATALOG_GRID_TEMPLATE = "flooringCatalogGrid";

function ensureCatalogGridBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasGrid = blocks.some(
    (block) => resolveTemplateName(block) === FLOORING_CATALOG_GRID_TEMPLATE,
  );

  if (hasGrid) return blocks;

  return [{ _template: FLOORING_CATALOG_GRID_TEMPLATE } as HomeBlock, ...blocks];
}

export default function FlooringOverviewPage({
  data,
  pageSettingsRecord,
}: FlooringOverviewPageProps) {
  const rawBlocks = useResolvedSharedSectionBlocks(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensureCatalogGridBlock(rawBlocks as HomeBlock[]);

  return (
    <div className="bg-white" suppressHydrationWarning>
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const blockField = tinaField(blockRecord) || undefined;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case "flooringCatalogGrid":
            return (
              <div data-tina-field={blockField} key={key}>
                <FlooringCatalogGridSection block={blockRecord} data={data} />
              </div>
            );

          default:
            return (
              <SharedPageSectionRenderer
                block={blockRecord}
                key={key}
                template={template}
              />
            );
        }
      })}
    </div>
  );
}
