"use client";

import { useMemo, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { DownloadIcon, ExpandIcon } from "@/components/resources/ResourceIcons";
import ResourcePreviewLightbox from "@/components/resources/ResourcePreviewLightbox";
import {
  documentPageUrls,
  resourceCoverUrl,
  resourceDownloadUrl,
} from "@/lib/resource-assets";
import { asBlockArray, asNumber, asText, type BlockRecord } from "./block-types";

const UNGROUPED = "__ungrouped__";

interface ResourceFileItem {
  coverUrl: string;
  description: string;
  downloadUrl: string;
  pageCount: number;
  pages: string[];
  raw: BlockRecord;
  title: string;
}

/**
 * Guides, care sheets and the warehouse map — small one- and two-page files.
 *
 * These preview as images in the same viewer the magazines use rather than
 * embedding the PDF, so a care sheet opens instantly and reads the same on a
 * phone as on a desktop. The untouched original is always one click away.
 */
export default function ResourceFilesSection({ block }: { block: BlockRecord }) {
  const [preview, setPreview] = useState<{ index: number; key: string } | null>(null);

  const heading = asText(block.heading);
  const subheading = asText(block.subheading);

  const groups = useMemo(() => {
    const byCategory = new Map<string, { items: Array<ResourceFileItem & { key: string }>; title: string }>();

    asBlockArray(block.items).forEach((item, index) => {
      const assetBase = asText(item.assetBase);
      const downloadFile = asText(item.downloadFile);
      // Either half of the pair works: a generated asset folder, or files the
      // editor uploaded straight through the Tina media manager.
      const uploadedPages = asBlockArray(item.pageImages).map((page) => asText(page.image));
      const pages = documentPageUrls(assetBase, asNumber(item.pageCount), uploadedPages);
      const downloadUrl = resourceDownloadUrl(assetBase, downloadFile, asText(item.downloadUrl));
      const pageCount = pages.length;
      const category = asText(item.category).trim();
      const categoryKey = category || UNGROUPED;

      const entry: ResourceFileItem & { key: string } = {
        coverUrl: resourceCoverUrl(assetBase, asText(item.coverOverride)) || pages[0] || "",
        description: asText(item.description),
        downloadUrl,
        key: `${assetBase || downloadUrl || "resource"}-${index}`,
        pageCount,
        pages,
        raw: item,
        title: asText(item.title, "Document"),
      };

      const existing = byCategory.get(categoryKey);
      if (existing) {
        existing.items.push(entry);
        return;
      }
      byCategory.set(categoryKey, { items: [entry], title: category });
    });

    return [...byCategory.values()];
  }, [block.items]);

  const activeItem = useMemo(() => {
    if (!preview) return undefined;
    for (const group of groups) {
      const match = group.items.find((item) => item.key === preview.key);
      if (match) return match;
    }
    return undefined;
  }, [groups, preview]);

  return (
    <section className="bg-[var(--cp-brand-neutral-50)]">
      <div className="cp-container px-4 py-14 md:px-8 md:py-[88px]">
        {heading ? (
          <h2
            className="text-[24px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]"
            data-tina-field={tinaField(block, "heading")}
          >
            {heading}
          </h2>
        ) : null}

        {subheading ? (
          <p
            className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-[var(--cp-gray-2)] md:text-[18px]"
            data-tina-field={tinaField(block, "subheading")}
          >
            {subheading}
          </p>
        ) : null}

        {groups.length ? (
          <div className="mt-10 space-y-12 md:mt-12 md:space-y-16">
            {groups.map((group) => (
              <div key={group.title || UNGROUPED}>
                {group.title ? (
                  <h3 className="text-[14px] uppercase tracking-[0.12em] text-[var(--cp-gray-3)]">{group.title}</h3>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-[15px] sm:grid-cols-2 md:mt-6 md:grid-cols-3 md:gap-7">
                  {group.items.map((item) => {
                    const canPreview = item.pages.length > 0;
                    const openPreview = () => setPreview({ index: 0, key: item.key });

                    return (
                      <article
                        className="group flex h-full flex-col"
                        key={item.key}
                      >
                        <button
                          aria-label={`Preview ${item.title}`}
                          className="relative block aspect-[4/5] w-full overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] disabled:cursor-default"
                          data-tina-field={tinaField(item.raw, "assetBase")}
                          disabled={!canPreview}
                          onClick={openPreview}
                          type="button"
                        >
                          {item.coverUrl ? (
                            <FillImage
                              alt={`${item.title} preview`}
                              className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                              src={item.coverUrl}
                            />
                          ) : null}

                          {canPreview ? (
                            <span className="absolute inset-0 flex items-center justify-center bg-[rgba(38,38,35,0.4)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <span className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[2px] border border-white bg-transparent px-8 text-[20px] font-medium leading-[1.2] text-white">
                                <ExpandIcon className="h-4 w-4" />
                                Preview
                              </span>
                            </span>
                          ) : null}
                        </button>

                        <div className="flex flex-1 flex-col pt-4">
                          <h4
                            className="text-[18px] font-semibold leading-[1.3] text-[var(--cp-primary-500)]"
                            data-tina-field={tinaField(item.raw, "title")}
                          >
                            {item.title}
                          </h4>

                          {item.description ? (
                            <p
                              className="mt-1.5 text-[15px] leading-[1.5] text-[var(--cp-gray-2)]"
                              data-tina-field={tinaField(item.raw, "description")}
                            >
                              {item.description}
                            </p>
                          ) : null}

                          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
                            {item.downloadUrl ? (
                              <a
                                className="inline-flex items-center gap-2 text-[15px] leading-[1.4] text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-primary-400)]"
                                data-tina-field={tinaField(item.raw, "downloadFile")}
                                download
                                href={item.downloadUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                <DownloadIcon className="h-[18px] w-[18px]" />
                                Download
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-[var(--cp-primary-100)] bg-white px-6 py-10 text-center md:mt-12">
            <p className="text-[20px] text-[var(--cp-primary-500)]">No documents published yet.</p>
          </div>
        )}
      </div>

      {activeItem ? (
        <ResourcePreviewLightbox
          index={preview?.index ?? 0}
          onClose={() => setPreview(null)}
          onIndexChange={(index) => setPreview((current) => (current ? { ...current, index } : current))}
          open
          showThumbnails={activeItem.pages.length > 1}
          slides={activeItem.pages.map((src, pageIndex) => ({
            alt:
              activeItem.pageCount > 1
                ? `${activeItem.title}, page ${pageIndex + 1} of ${activeItem.pageCount}`
                : activeItem.title,
            src,
          }))}
          title={activeItem.title}
        />
      ) : null}
    </section>
  );
}
