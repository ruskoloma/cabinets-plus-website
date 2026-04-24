"use client";

import { tinaField } from "tinacms/dist/react";
import ContactUsSection from "@/components/shared/ContactUsSection";
import ProductProjectStrip from "@/components/special/catalog-product/ProductProjectStrip";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import {
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_FLOORING_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks, useSharedSectionBlock } from "@/components/shared/use-shared-sections";
import FlooringProductInfoSection from "./FlooringProductInfoSection";
import FlooringRelatedProducts from "./FlooringRelatedProducts";
import type { FlooringDetailPageProps } from "./types";

const FLOORING_PRODUCT_INFO_TEMPLATE = "flooringProductInfo";

function ensureProductInfoBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasProductInfo = blocks.some(
    (block) => resolveTemplateName(block) === FLOORING_PRODUCT_INFO_TEMPLATE,
  );

  if (hasProductInfo) return blocks;

  return [{ _template: FLOORING_PRODUCT_INFO_TEMPLATE } as HomeBlock, ...blocks];
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? value : fallback;
}

export default function FlooringDetailPage({
  flooring,
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
}: FlooringDetailPageProps) {
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
          case "flooringProductInfo":
            return (
              <div data-tina-field={blockField} key={key}>
                <FlooringProductInfoSection
                  block={blockRecord}
                  flooring={flooring}
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
            const flooringRecord = flooring as unknown as Record<string, unknown>;
            const flooringFieldName = tinaField(flooringRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <ProductProjectStrip
                  description={blockDescription}
                  descriptionTinaField={descriptionField}
                  focusListKey={TINA_LIST_KEY_FLOORING_RELATED_PROJECTS}
                  focusRootFieldName={flooringFieldName}
                  imageSizeChoice={imageSizeChoice}
                  items={projectItems.map((project) => ({
                    file: project.file,
                    title: project.title,
                    href: project.href,
                    focusItemId: project.projectSource ? getProjectReferenceFocusItemId(project.projectSource) : undefined,
                    selectionTinaField:
                      typeof project.selectionIndex === "number"
                        ? tinaField(flooringRecord, `relatedProjects.${project.selectionIndex}.project`) || undefined
                        : tinaField(flooringRecord, "relatedProjects") || undefined,
                    imageTinaField: project.mediaSource
                      ? tinaField(project.mediaSource, "file") || undefined
                      : project.media
                        ? tinaField(project.media as unknown as Record<string, unknown>, "file") || undefined
                        : project.project
                          ? tinaField(project.project as unknown as Record<string, unknown>, "media.0.file") || undefined
                          : undefined,
                    titleTinaField: project.projectSource
                      ? tinaField(project.projectSource, "title") || undefined
                      : project.media
                        ? tinaField(project.media as unknown as Record<string, unknown>, "label") || tinaField(project.media as unknown as Record<string, unknown>, "altText") || undefined
                        : project.project
                          ? tinaField(project.project as unknown as Record<string, unknown>, "title") || undefined
                          : undefined,
                  }))}
                  sectionTinaField={flooringFieldName}
                  title={blockTitle}
                  titleTinaField={titleField}
                />
              </div>
            );
          }

          case "relatedProducts": {
            const blockTitle = readString(blockRecord.title, pageText.relatedProductsTitle);
            const titleField = tinaField(blockRecord, "title") || undefined;
            const flooringRecord = flooring as unknown as Record<string, unknown>;
            const flooringFieldName = tinaField(flooringRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <FlooringRelatedProducts
                  imageSizeChoice={imageSizeChoice}
                  items={relatedItems}
                  sectionTinaField={flooringFieldName}
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

      <div className="sr-only" data-current-flooring={currentSlug} />
    </div>
  );
}
