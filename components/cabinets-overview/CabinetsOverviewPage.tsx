"use client";

import { tinaField } from "tinacms/dist/react";
import CabinetCatalogGridSection from "./CabinetCatalogGridSection";
import { resolveTemplateName, toBlockArray, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import type { CabinetsOverviewDataShape } from "./types";

interface CabinetsOverviewPageProps {
  data: CabinetsOverviewDataShape;
  pageSettingsRecord?: Record<string, unknown> | null;
}

const CABINET_CATALOG_GRID_TEMPLATE = "cabinetCatalogGrid";

function ensureCatalogGridBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasGrid = blocks.some(
    (block) => resolveTemplateName(block) === CABINET_CATALOG_GRID_TEMPLATE,
  );

  if (hasGrid) return blocks;

  return [{ _template: CABINET_CATALOG_GRID_TEMPLATE } as HomeBlock, ...blocks];
}

export default function CabinetsOverviewPage({
  data,
  pageSettingsRecord,
}: CabinetsOverviewPageProps) {
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
          case "cabinetCatalogGrid":
            return (
              <div data-tina-field={blockField} key={key}>
                <CabinetCatalogGridSection block={blockRecord} data={data} />
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
