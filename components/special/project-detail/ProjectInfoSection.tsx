"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import MediaLightbox, { isVideoFile } from "@/components/ui/MediaLightbox";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import { focusTinaSidebarMediaItem } from "@/lib/tina-media-focus";
import { useTinaQuickEditEnabled } from "@/lib/use-tina-quick-edit-enabled";
import {
  getProjectDescription,
  getProjectGalleryAlt,
  getProjectHeading,
  getProjectSlug,
} from "./helpers";
import type { ProjectGalleryItem, ProjectOverviewItem } from "./types";

function PlayIcon() {
  return (
    <svg aria-hidden className="h-[54px] w-[45px]" fill="none" viewBox="0 0 100 120">
      <path d="M0 0v120l100-60L0 0Z" fill="white" />
    </svg>
  );
}

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

interface ProjectInfoSectionProps {
  block?: Record<string, unknown> | null;
  project: ProjectOverviewItem;
  galleryItems: ProjectGalleryItem[];
}

export default function ProjectInfoSection({ block, project, galleryItems }: ProjectInfoSectionProps) {
  const { edit } = useEditState();
  const quickEditEnabled = useTinaQuickEditEnabled();
  const rawProject = project as unknown as Record<string, unknown>;
  const projectFieldName = tinaField(rawProject) || undefined;
  const currentSlug = getProjectSlug(project, "project");
  const heading = getProjectHeading(project, currentSlug);
  const description = getProjectDescription(project);

  const breadcrumbLabel = (readStringField(block, "breadcrumbLabel") || "").trim() || "Gallery";
  const breadcrumbLink = (readStringField(block, "breadcrumbLink") || "").trim() || "/gallery";
  const galleryImageSizeChoice = readStringField(block, "galleryImageSize");
  const galleryGridImageVariant: ImageVariantPreset | undefined = resolveConfiguredImageVariant(galleryImageSizeChoice, "card");

  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const lightboxItems = useMemo(
    () =>
      galleryItems.map((item) => ({
        alt: getProjectGalleryAlt(project, item),
        src: item.file,
        type: isVideoFile(item.file) ? ("video" as const) : ("image" as const),
      })),
    [galleryItems, project],
  );

  return (
    <>
      {/* No data-tina-field on outer <section>: clicks on media tiles must NOT bubble up to
          any ancestor so Tina focuses the project's `media` list item via the custom postMessage
          channel alone (see the tile onClick). Inner elements (breadcrumb, title, description)
          keep their own data-tina-field so those specific fields remain editable. */}
      <section className="bg-white">
        <div className="cp-container px-4 pb-12 pt-[35px] md:px-8 md:pb-[88px] md:pt-[88px]">
          <div className="max-w-[1376px]">
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex min-w-0 flex-wrap items-center gap-1 text-[16px] leading-[1.2] text-[var(--cp-primary-300)] md:mb-7 md:text-[14px]"
            >
              <Link
                className="transition-colors hover:text-[var(--cp-primary-350)]"
                data-tina-field={block ? tinaField(block, "breadcrumbLabel") || undefined : undefined}
                href={breadcrumbLink}
              >
                {breadcrumbLabel}
              </Link>
              <span>/</span>
              <span data-tina-field={tinaField(rawProject, "title") || undefined}>{heading}</span>
            </nav>

            <div className="flex max-w-[1376px] flex-col gap-4 text-[var(--cp-primary-500)] md:gap-7">
              <h1
                className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
                data-tina-field={tinaField(rawProject, "title") || undefined}
              >
                {heading}
              </h1>

              {description ? (
                <p
                  className="max-w-[1376px] whitespace-pre-line text-[18px] leading-[1.5] md:text-[24px]"
                  data-tina-field={tinaField(rawProject, "description") || undefined}
                >
                  {description}
                </p>
              ) : null}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:mt-8 md:grid-cols-4 md:gap-7">
              {galleryItems.map((item, index) => {
                const useCustomMediaFocus = Boolean(edit && quickEditEnabled && item.sourceType === "media");
                const isVideo = isVideoFile(item.file);
                const buttonClassName = useCustomMediaFocus
                  ? "relative aspect-square overflow-hidden bg-[var(--cp-primary-100)] outline outline-2 outline-dashed outline-[rgba(34,150,254,0.45)] transition-[outline-color,box-shadow] duration-150 hover:outline-[rgba(34,150,254,1)] hover:shadow-[inset_0_0_0_9999px_rgba(34,150,254,0.28)]"
                  : "relative aspect-square overflow-hidden bg-[var(--cp-primary-100)]";

                return (
                  <button
                    aria-label={`Open ${isVideo ? "video" : "image"} ${index + 1}`}
                    className={buttonClassName}
                    key={`${item.file}-${index}`}
                    onClick={(event) => {
                      if (useCustomMediaFocus) {
                        event.preventDefault();
                        event.stopPropagation();
                        focusTinaSidebarMediaItem({
                          rootFieldName: projectFieldName,
                          mediaFile: item.file,
                        });
                        return;
                      }

                      setActiveGalleryIndex(index);
                    }}
                    type="button"
                  >
                    {isVideo ? (
                      <>
                        <video aria-hidden className="h-full w-full object-cover" muted playsInline preload="metadata" src={item.file} />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayIcon />
                        </div>
                      </>
                    ) : (
                      <FillImage
                        alt={getProjectGalleryAlt(project, item)}
                        className="object-cover"
                        sizes="(min-width: 768px) 25vw, 50vw"
                        src={item.file}
                        variant={galleryGridImageVariant}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <MediaLightbox
        index={activeGalleryIndex ?? 0}
        items={lightboxItems}
        onClose={() => setActiveGalleryIndex(null)}
        onIndexChange={(index) => setActiveGalleryIndex(index)}
        open={activeGalleryIndex !== null}
      />
    </>
  );
}
