"use client";

import { tinaField } from "tinacms/dist/react";
import CabinetProductInfoSection from "./CabinetProductInfoSection";
import CabinetProjectStrip from "./CabinetProjectStrip";
import CabinetRelatedProducts from "./CabinetRelatedProducts";
import ContactUsSection from "@/components/shared/ContactUsSection";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks, useSharedSectionBlock } from "@/components/shared/use-shared-sections";
import type {
  CabinetData,
  CabinetGalleryItem,
  CabinetListItem,
  CabinetPageTextConfig,
  CabinetProjectItem,
  CabinetRelatedItem,
  CabinetTechnicalDetail,
} from "./types";

interface CabinetDoorPageProps {
  cabinet: CabinetData;
  currentSlug: string;
  previousProduct?: CabinetListItem;
  nextProduct?: CabinetListItem;
  galleryItems: CabinetGalleryItem[];
  technicalDetails: CabinetTechnicalDetail[];
  projectItems: CabinetProjectItem[];
  relatedItems: CabinetRelatedItem[];
  pageText: CabinetPageTextConfig;
  contactBlock?: Record<string, unknown> | null;
  pageSettingsRecord?: Record<string, unknown> | null;
}

const CABINET_PRODUCT_INFO_TEMPLATE = "cabinetProductInfo";

function ensureProductInfoBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasProductInfo = blocks.some(
    (block) => resolveTemplateName(block) === CABINET_PRODUCT_INFO_TEMPLATE,
  );

  if (hasProductInfo) return blocks;

  return [{ _template: CABINET_PRODUCT_INFO_TEMPLATE } as HomeBlock, ...blocks];
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? value : fallback;
}

export default function CabinetDoorPage({
  cabinet,
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
}: CabinetDoorPageProps) {
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
          case "cabinetProductInfo":
            return (
              <div data-tina-field={blockField} key={key}>
                <CabinetProductInfoSection
                  block={blockRecord}
                  cabinet={cabinet}
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
            const cabinetRecord = cabinet as unknown as Record<string, unknown>;
            const cabinetFieldName = tinaField(cabinetRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <CabinetProjectStrip
                  description={blockDescription}
                  descriptionTinaField={descriptionField}
                  imageSizeChoice={imageSizeChoice}
                  items={projectItems}
                  sectionTinaField={cabinetFieldName}
                  selectionListTinaField={tinaField(cabinetRecord, "relatedProjects") || undefined}
                  selectionSourceRecord={cabinetRecord}
                  title={blockTitle}
                  titleTinaField={titleField}
                />
              </div>
            );
          }

          case "relatedProducts": {
            const blockTitle = readString(blockRecord.title, pageText.relatedProductsTitle);
            const titleField = tinaField(blockRecord, "title") || undefined;
            const cabinetRecord = cabinet as unknown as Record<string, unknown>;
            const cabinetFieldName = tinaField(cabinetRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <CabinetRelatedProducts
                  imageSizeChoice={imageSizeChoice}
                  items={relatedItems}
                  sectionTinaField={cabinetFieldName}
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

      <div className="sr-only" data-current-cabinet={currentSlug} />
    </div>
  );
}
