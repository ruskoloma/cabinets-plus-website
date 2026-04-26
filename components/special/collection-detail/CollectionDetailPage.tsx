"use client";

import ContactUsSection from "@/components/shared/ContactUsSection";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks, useSharedSectionBlock } from "@/components/shared/use-shared-sections";
import { buildCollectionGallery, getCollectionSlug } from "./helpers";
import CollectionInfoSection from "./CollectionInfoSection";
import CollectionRelatedProjectsSection from "./CollectionRelatedProjectsSection";
import type { CollectionDetailPageProps } from "./types";

const COLLECTION_INFO_TEMPLATE = "collectionInfo";

function ensureCollectionInfoBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasCollectionInfo = blocks.some(
    (block) => resolveTemplateName(block) === COLLECTION_INFO_TEMPLATE,
  );
  if (hasCollectionInfo) return blocks;
  return [{ _template: COLLECTION_INFO_TEMPLATE } as HomeBlock, ...blocks];
}

export default function CollectionDetailPage({
  collection,
  pageSettingsRecord,
  overviewData,
  contactBlock,
}: CollectionDetailPageProps) {
  const rawBlocks = useResolvedSharedSectionBlocks(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensureCollectionInfoBlock(rawBlocks as HomeBlock[]);
  const sharedContactBlock = useSharedSectionBlock("contactSection");
  const fallbackContactBlock = contactBlock || sharedContactBlock;

  const galleryItems = buildCollectionGallery(collection);
  const currentSlug = getCollectionSlug(collection, "collection");

  return (
    <div className="bg-white">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case "collectionInfo":
            // No outer data-tina-field wrapper: clicking a media tile must focus the COLLECTION
            // document's media list item, not the page-settings block. Block-level settings
            // (breadcrumb label, image sizes) stay reachable through inner data-tina-fields.
            return (
              <CollectionInfoSection block={blockRecord} collection={collection} galleryItems={galleryItems} key={key} />
            );

          case "collectionRelatedProjects":
            // No outer data-tina-field wrapper: clicking a related-project card must focus the
            // current collection's relatedProjects list row, not the block's page-settings object.
            return (
              <CollectionRelatedProjectsSection
                block={blockRecord}
                collection={collection}
                key={key}
                overviewData={overviewData}
              />
            );

          default:
            return (
              <SharedPageSectionRenderer block={blockRecord} key={key} template={template} />
            );
        }
      })}

      {fallbackContactBlock && !blocks.some((block) => resolveTemplateName(block) === "contactSection") ? (
        <ContactUsSection block={fallbackContactBlock} />
      ) : null}

      <div className="sr-only" data-current-collection={currentSlug} />
    </div>
  );
}
