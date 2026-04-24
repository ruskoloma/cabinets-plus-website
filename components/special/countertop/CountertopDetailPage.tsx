"use client";

import { tinaField } from "tinacms/dist/react";
import ContactUsSection from "@/components/shared/ContactUsSection";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks, useSharedSectionBlock } from "@/components/shared/use-shared-sections";
import CountertopProductInfoSection from "./CountertopProductInfoSection";
import CountertopProjectStrip from "./CountertopProjectStrip";
import CountertopRelatedProducts from "./CountertopRelatedProducts";
import type { CountertopDetailPageProps } from "./types";

const COUNTERTOP_PRODUCT_INFO_TEMPLATE = "countertopProductInfo";

function ensureProductInfoBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasProductInfo = blocks.some(
    (block) => resolveTemplateName(block) === COUNTERTOP_PRODUCT_INFO_TEMPLATE,
  );

  if (hasProductInfo) return blocks;

  return [{ _template: COUNTERTOP_PRODUCT_INFO_TEMPLATE } as HomeBlock, ...blocks];
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? value : fallback;
}

export default function CountertopDetailPage({
  countertop,
  currentSlug,
  previousProduct,
  nextProduct,
  galleryItems,
  technicalDetails,
  projectItems,
  relatedItems,
  pageText,
  contactBlock,
  pageSettingsRecord,
}: CountertopDetailPageProps) {
  const rawBlocks = useResolvedSharedSectionBlocks(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensureProductInfoBlock(rawBlocks as HomeBlock[]);
  const sharedContactBlock = useSharedSectionBlock("contactSection");
  const fallbackContactBlock = contactBlock || sharedContactBlock;

  return (
    <div className="bg-white">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const blockField = tinaField(blockRecord) || undefined;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case "countertopProductInfo":
            return (
              <div data-tina-field={blockField} key={key}>
                <CountertopProductInfoSection
                  block={blockRecord}
                  countertop={countertop}
                  galleryItems={galleryItems}
                  nextProduct={nextProduct}
                  pageText={pageText}
                  previousProduct={previousProduct}
                  technicalDetails={technicalDetails}
                />
              </div>
            );

          case "projectsUsingThisProduct": {
            const blockTitle = readString(blockRecord.title, pageText.projectsSectionTitle);
            const blockDescription = readString(blockRecord.description, pageText.projectsSectionDescription);
            const titleField = tinaField(blockRecord, "title") || undefined;
            const descriptionField = tinaField(blockRecord, "description") || undefined;
            const countertopRecord = countertop as unknown as Record<string, unknown>;
            const countertopFieldName = tinaField(countertopRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <CountertopProjectStrip
                  description={blockDescription}
                  descriptionTinaField={descriptionField}
                  imageSizeChoice={imageSizeChoice}
                  items={projectItems}
                  sectionTinaField={countertopFieldName}
                  selectionListTinaField={tinaField(countertopRecord, "relatedProjects") || undefined}
                  selectionSourceRecord={countertopRecord}
                  title={blockTitle}
                  titleTinaField={titleField}
                />
              </div>
            );
          }

          case "relatedProducts": {
            const blockTitle = readString(blockRecord.title, pageText.relatedProductsTitle);
            const titleField = tinaField(blockRecord, "title") || undefined;
            const countertopRecord = countertop as unknown as Record<string, unknown>;
            const countertopFieldName = tinaField(countertopRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <CountertopRelatedProducts
                  imageSizeChoice={imageSizeChoice}
                  items={relatedItems}
                  sectionTinaField={countertopFieldName}
                  title={blockTitle}
                  titleTinaField={titleField}
                />
              </div>
            );
          }

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

      {fallbackContactBlock && !blocks.some((block) => resolveTemplateName(block) === "contactSection") ? (
        <ContactUsSection block={fallbackContactBlock} />
      ) : null}

      <div className="sr-only" data-current-countertop={currentSlug} />
    </div>
  );
}
