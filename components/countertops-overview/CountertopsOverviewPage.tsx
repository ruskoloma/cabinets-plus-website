"use client";

import { tinaField } from "tinacms/dist/react";
import CountertopCatalogGridSection from "./CountertopCatalogGridSection";
import { resolveTemplateName, toBlockArray, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import type { CountertopsOverviewDataShape } from "./types";

interface CountertopsOverviewPageProps {
  data: CountertopsOverviewDataShape;
  pageSettingsRecord?: Record<string, unknown> | null;
}

const COUNTERTOP_CATALOG_GRID_TEMPLATE = "countertopCatalogGrid";

function ensureCatalogGridBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasGrid = blocks.some(
    (block) => resolveTemplateName(block) === COUNTERTOP_CATALOG_GRID_TEMPLATE,
  );

  if (hasGrid) return blocks;

  return [{ _template: COUNTERTOP_CATALOG_GRID_TEMPLATE } as HomeBlock, ...blocks];
}

export default function CountertopsOverviewPage({
  data,
  pageSettingsRecord,
}: CountertopsOverviewPageProps) {
  const rawBlocks = toBlockArray(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensureCatalogGridBlock(rawBlocks);

  return (
    <div className="bg-white" suppressHydrationWarning>
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const blockField = tinaField(blockRecord) || undefined;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case "countertopCatalogGrid":
            return (
              <div data-tina-field={blockField} key={key}>
                <CountertopCatalogGridSection block={blockRecord} data={data} />
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
