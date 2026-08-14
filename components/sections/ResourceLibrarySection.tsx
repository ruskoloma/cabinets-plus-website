"use client";

import { useMemo, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { DownloadIcon, ExpandIcon } from "@/components/resources/ResourceIcons";
import ResourcePreviewLightbox from "@/components/resources/ResourcePreviewLightbox";
import {
  magazineSpreadUrls,
  resourceCoverUrl,
  resourceDownloadUrl,
} from "@/lib/resource-assets";
import { asBlockArray, asNumber, asText, type BlockRecord } from "./block-types";

interface OpenPreview {
  index: number;
  itemIndex: number;
}

/**
 * The magazine shelf: cover cards that open a full-screen spread viewer.
 *
 * Nothing heavy loads with the page — the spread images are only requested
 * once a cover is clicked, so each magazine costs only one thumbnail on first
 * paint.
 */
export default function ResourceLibrarySection({ block }: { block: BlockRecord }) {
  const [preview, setPreview] = useState<OpenPreview | null>(null);

  const pageTitle = asText(block.pageTitle);
  const intro = asText(block.intro);
  const heading = asText(block.heading);

  const items = useMemo(
    () =>
      asBlockArray(block.items).map((item) => {
        const assetBase = asText(item.assetBase);
        const spreadCount = asNumber(item.spreadCount);
        const downloadFile = asText(item.downloadFile);
        const title = asText(item.title, "Magazine");

        // A directly uploaded PDF wins over the asset-folder convention, so an
        // editor can swap the download without re-running the rasterizer.
        const downloadUrl = resourceDownloadUrl(assetBase, downloadFile, asText(item.downloadUrl));

        return {
          coverUrl: resourceCoverUrl(assetBase, asText(item.coverOverride)),
          downloadUrl,
          raw: item,
          spreadCount,
          spreads: magazineSpreadUrls(assetBase, spreadCount),
          subtitle: asText(item.subtitle),
          title,
        };
      }),
    [block.items],
  );

  const activeItem = preview ? items[preview.itemIndex] : undefined;

  return (
    <section className="bg-white">
      <div className="cp-container px-4 pb-14 pt-14 md:px-8 md:pb-[88px] md:pt-[88px]">
        {pageTitle ? (
          <h1
            className="text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
            data-tina-field={tinaField(block, "pageTitle")}
          >
            {pageTitle}
          </h1>
        ) : null}

        {intro ? (
          <p
            className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-[var(--cp-gray-2)] md:mt-6 md:text-[18px]"
            data-tina-field={tinaField(block, "intro")}
          >
            {intro}
          </p>
        ) : null}

        {heading ? (
          <h2
            className="mt-12 text-[24px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:mt-16 md:text-[32px]"
            data-tina-field={tinaField(block, "heading")}
          >
            {heading}
          </h2>
        ) : null}

        {items.length ? (
          <div className="mt-8 grid grid-cols-1 gap-x-[15px] gap-y-10 sm:grid-cols-2 md:mt-10 md:grid-cols-3 md:gap-x-7 md:gap-y-12">
            {items.map((item, itemIndex) => {
              const canPreview = item.spreads.length > 0;
              const openPreview = () => setPreview({ index: 0, itemIndex });

              return (
                <article className="group flex h-full flex-col" key={`${item.title}-${itemIndex}`}>
                  <button
                    aria-label={`Open ${item.title}`}
                    className="relative block aspect-[10/13] w-full overflow-hidden bg-[var(--cp-brand-neutral-100)] disabled:cursor-default"
                    data-tina-field={tinaField(item.raw, "assetBase")}
                    disabled={!canPreview}
                    onClick={openPreview}
                    type="button"
                  >
                    {item.coverUrl ? (
                      <FillImage
                        alt={`${item.title} cover`}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                        src={item.coverUrl}
                      />
                    ) : null}

                    {canPreview ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-[rgba(20,20,19,0.45)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-2 border border-white/70 px-4 py-2 text-[13px] uppercase tracking-[0.08em] text-white">
                          <ExpandIcon className="h-4 w-4" />
                          View
                        </span>
                      </span>
                    ) : null}
                  </button>

                  <h3 className="mt-4 text-[20px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
                    <button
                      className="text-left transition-colors hover:text-[var(--cp-primary-400)] disabled:cursor-default"
                      data-tina-field={tinaField(item.raw, "title")}
                      disabled={!canPreview}
                      onClick={openPreview}
                      type="button"
                    >
                      {item.title}
                    </button>
                  </h3>

                  {item.subtitle ? (
                    <p
                      className="mt-2 text-[16px] leading-[1.5] text-[var(--cp-gray-2)]"
                      data-tina-field={tinaField(item.raw, "subtitle")}
                    >
                      {item.subtitle}
                    </p>
                  ) : null}

                  {item.downloadUrl ? (
                    <div className="mt-auto pt-5">
                      <a
                        className="cp-btn cp-btn--outline cp-btn--small gap-2"
                        data-tina-field={tinaField(item.raw, "downloadFile")}
                        download
                        href={item.downloadUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <DownloadIcon className="h-[18px] w-[18px]" />
                        Download PDF
                      </a>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 border border-[var(--cp-primary-100)] px-6 py-10 text-center md:mt-12">
            <p className="text-[20px] text-[var(--cp-primary-500)]">No magazines published yet.</p>
          </div>
        )}
      </div>

      {activeItem ? (
        <ResourcePreviewLightbox
          index={preview?.index ?? 0}
          onClose={() => setPreview(null)}
          onIndexChange={(index) => setPreview((current) => (current ? { ...current, index } : current))}
          open
          showThumbnails
          slides={activeItem.spreads.map((src, spreadIndex) => ({
            alt: `${activeItem.title}, spread ${spreadIndex + 1} of ${activeItem.spreadCount}`,
            src,
          }))}
          title={activeItem.title}
        />
      ) : null}
    </section>
  );
}
