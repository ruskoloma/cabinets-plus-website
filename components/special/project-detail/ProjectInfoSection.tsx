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
  buildProjectGallery,
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

  const [showBefore, setShowBefore] = useState(false);
  const beforeGalleryItems = useMemo(() => buildProjectGallery(project, "imagesBefore"), [project]);
  const hasBeforeImages = beforeGalleryItems.length > 0;
  const isShowingBefore = hasBeforeImages && showBefore;
  const visibleGalleryItems = isShowingBefore ? beforeGalleryItems : galleryItems;
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const lightboxItems = useMemo(
    () =>
      visibleGalleryItems.map((item) => ({
        alt: getProjectGalleryAlt(project, item),
        src: item.file,
        type: isVideoFile(item.file) ? ("video" as const) : ("image" as const),
      })),
    [visibleGalleryItems, project],
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

            {hasBeforeImages ? (
              <button
                aria-checked={!isShowingBefore}
                aria-controls="project-photo-gallery"
                aria-label="Show after remodel photos"
                className="mt-8 inline-flex min-h-11 items-center gap-3 rounded-sm text-[16px] leading-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cp-primary-300)]"
                onClick={() => {
                  setActiveGalleryIndex(null);
                  setShowBefore(!isShowingBefore);
                }}
                role="switch"
                type="button"
              >
                <span aria-hidden className={isShowingBefore ? "text-[var(--cp-primary-500)]" : "text-[var(--cp-primary-300)]"}>Before</span>
                <span aria-hidden className="flex h-6 w-11 shrink-0 items-center rounded-full border border-[var(--cp-primary-100)] bg-white p-[3px]">
                  <span className={`h-4 w-4 rounded-full bg-[var(--cp-primary-300)] transition-transform motion-reduce:transition-none ${isShowingBefore ? "translate-x-0" : "translate-x-[18px]"}`} />
                </span>
                <span aria-hidden className={isShowingBefore ? "text-[var(--cp-primary-300)]" : "text-[var(--cp-primary-500)]"}>After</span>
              </button>
            ) : null}

            <div
              aria-label={hasBeforeImages ? `${isShowingBefore ? "Before" : "After"} remodel photos` : "Project photos"}
              className={`${hasBeforeImages ? "mt-6" : "mt-8"} grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-7`}
              id="project-photo-gallery"
              role="group"
            >
              {visibleGalleryItems.map((item, index) => {
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
