"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditState } from "tinacms/dist/react";
import { getImageVariantUrl } from "@/lib/image-variants";
import FillImage from "@/components/ui/FillImage";
import MediaLightbox, { isVideoFile } from "@/components/ui/MediaLightbox";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import { TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME } from "@/lib/tina-list-focus";
import { focusTinaSidebarMediaItem } from "@/lib/tina-media-focus";
import { useTinaQuickEditEnabled } from "@/lib/use-tina-quick-edit-enabled";
import type { ProductGalleryItemViewModel } from "./types";

interface ProductMediaGalleryProps {
  items: ProductGalleryItemViewModel[];
  productName: string;
  expandLabel?: string;
  thumbImageSizeChoice?: string | null;
  mainImageSizeChoice?: string | null;
  // Kept for existing page settings; fullscreen media always uses original files.
  lightboxImageSizeChoice?: string | null;
  focusRootFieldName?: string;
}

function ExpandIcon() {
  return (
    <svg aria-hidden className="h-6 w-6 text-[var(--cp-primary-500)]" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function PlayIcon({ className = "h-[90px] w-[75px]" }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 100 120">
      <path d="M0 0v120l100-60L0 0Z" fill="white" />
    </svg>
  );
}

const ACTIVE_MEDIA_MIN_PADDING = 12;
const ACTIVE_MEDIA_PREFERRED_PADDING = 65;

export default function ProductMediaGallery({
  items,
  productName,
  expandLabel = "Click to expand",
  thumbImageSizeChoice,
  mainImageSizeChoice,
  focusRootFieldName,
}: ProductMediaGalleryProps) {
  const { edit } = useEditState();
  const quickEditEnabled = useTinaQuickEditEnabled();
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [frameSize, setFrameSize] = useState(0);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const activeMediaFrameRef = useRef<HTMLDivElement | null>(null);
  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) || items[0] || null,
    [activeId, items],
  );
  const thumbImageVariant = resolveConfiguredImageVariant(thumbImageSizeChoice, "thumb");
  const mainImageVariant = resolveConfiguredImageVariant(mainImageSizeChoice, "feature");
  const lightboxItems = useMemo(
    () =>
      items.map((item) => ({
        alt: item.alt,
        poster: item.kind === "video" && item.previewFile && !isVideoFile(item.previewFile) ? item.previewFile : undefined,
        src: item.file,
        type: item.kind,
        videoType: item.mimeType,
      })),
    [items],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const pendingImages = items.filter((item) => item.kind === "image" && !imageAspectRatios[item.id]);
    if (!pendingImages.length) return undefined;

    let cancelled = false;

    pendingImages.forEach((item) => {
      const image = new window.Image();
      image.src = getImageVariantUrl(item.previewFile, mainImageVariant);
      image.onload = () => {
        if (cancelled || !image.naturalWidth || !image.naturalHeight) return;

        const aspectRatio = image.naturalWidth / image.naturalHeight;
        setImageAspectRatios((current) => {
          if (current[item.id] === aspectRatio) return current;
          return { ...current, [item.id]: aspectRatio };
        });
      };
    });

    return () => {
      cancelled = true;
    };
  }, [imageAspectRatios, items, mainImageVariant]);

  useEffect(() => {
    const element = activeMediaFrameRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const updateFrameSize = () => {
      setFrameSize(Math.round(element.getBoundingClientRect().width));
    };

    updateFrameSize();

    const observer = new ResizeObserver(() => updateFrameSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, [activeItem?.id]);

  const activeImageLayout = useMemo(() => {
    if (!activeItem || activeItem.kind !== "image" || !frameSize) return null;

    const aspectRatio = imageAspectRatios[activeItem.id];
    const minimumPadding = Math.min(ACTIVE_MEDIA_MIN_PADDING, frameSize / 2);
    const preferredPadding = Math.min(ACTIVE_MEDIA_PREFERRED_PADDING, frameSize / 2);
    const maxSizeWithMinimumPadding = Math.max(frameSize - minimumPadding * 2, 0);
    const maxSizeWithPreferredPadding = Math.max(frameSize - preferredPadding * 2, 0);

    if (!aspectRatio || !maxSizeWithMinimumPadding) {
      return {
        height: maxSizeWithMinimumPadding || frameSize,
        width: maxSizeWithMinimumPadding || frameSize,
      };
    }

    if (aspectRatio >= 1) {
      const height = Math.min(maxSizeWithPreferredPadding, maxSizeWithMinimumPadding / aspectRatio);
      return { height, width: height * aspectRatio };
    }

    const width = Math.min(maxSizeWithPreferredPadding, maxSizeWithMinimumPadding * aspectRatio);
    return { height: width / aspectRatio, width };
  }, [activeItem, frameSize, imageAspectRatios]);

  if (!activeItem) return null;

  // In edit mode, any tile/main-image click focuses the product's media list row via the
  // custom postMessage channel instead of opening the lightbox. We deliberately do NOT set
  // data-tina-field on the tile elements so Tina's native click handler can't walk up to
  // the page-settings block and focus it.
  const canUseCustomFocus = Boolean(edit && quickEditEnabled);
  const openLightbox = (event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    if (canUseCustomFocus) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      focusTinaSidebarMediaItem({
        rootFieldName: focusRootFieldName,
        mediaFile: activeItem.file,
      });
      return;
    }

    setLightboxIndex(Math.max(0, items.findIndex((item) => item.id === activeItem.id)));
  };

  const showThumbnails = items.length > 1;
  const activeVideoPoster = activeItem.kind === "video" && !isVideoFile(activeItem.previewFile)
    ? getImageVariantUrl(activeItem.previewFile, mainImageVariant)
    : undefined;

  return (
    <>
      <div className="flex w-full min-w-0 max-w-full flex-col-reverse gap-4 lg:flex-row lg:gap-7">
        {showThumbnails ? (
          <div className="cp-hide-scrollbar flex w-full min-w-0 max-w-full flex-shrink gap-4 overflow-x-auto pb-1 [justify-content:safe_center] lg:h-[557px] lg:w-fit lg:max-w-none lg:flex-shrink-0 lg:flex-col lg:items-start lg:gap-[29px] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:[justify-content:flex-start]">
            {items.map((item, index) => {
              const isActive = activeItem.id === item.id;
              const buttonClassName = canUseCustomFocus
                ? `relative h-[64px] w-[64px] shrink-0 overflow-hidden border bg-[#fafafa] transition lg:h-[90px] lg:w-[90px] ${isActive ? "border-[var(--cp-primary-500)]" : "border-transparent"} ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
                : `relative h-[64px] w-[64px] shrink-0 overflow-hidden border bg-[#fafafa] transition lg:h-[90px] lg:w-[90px] ${isActive ? "border-[var(--cp-primary-500)]" : "border-transparent"}`;

              return (
                <button
                  aria-label={`Show ${item.kind === "video" ? "video" : "image"} ${index + 1}`}
                  className={buttonClassName}
                  key={item.id}
                  onClick={(event) => {
                    setActiveId(item.id);

                    if (!canUseCustomFocus) return;

                    event.preventDefault();
                    event.stopPropagation();
                    focusTinaSidebarMediaItem({
                      rootFieldName: focusRootFieldName,
                      mediaFile: item.file,
                    });
                  }}
                  type="button"
                >
                  {item.kind === "video" && isVideoFile(item.previewFile) ? (
                    <video aria-hidden className="h-full w-full object-cover" muted playsInline preload="metadata" src={item.file} />
                  ) : (
                    <FillImage alt="" aria-hidden className="object-cover" sizes="(min-width: 1024px) 90px, 64px" src={item.previewFile} variant={thumbImageVariant} />
                  )}
                  {item.kind === "video" ? (
                    <>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayIcon className="h-5 w-4 lg:h-7 lg:w-6" />
                      </div>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <button
          aria-label={activeItem.kind === "video" ? `Open video for ${productName}` : `Expand image for ${productName}`}
          className={
            canUseCustomFocus
              ? `group relative block h-auto w-full max-w-[557px] overflow-hidden bg-[#fafafa] text-left lg:h-[557px] lg:w-[557px] lg:max-w-none lg:shrink-0 ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
              : "group relative block h-auto w-full max-w-[557px] overflow-hidden bg-[#fafafa] text-left lg:h-[557px] lg:w-[557px] lg:max-w-none lg:shrink-0"
          }
          onClick={(event) => openLightbox(event)}
          type="button"
        >
          <div ref={activeMediaFrameRef} className="aspect-square h-full w-full">
            {activeItem.kind === "video" ? (
              <>
                <video
                  aria-hidden
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  poster={activeVideoPoster}
                  preload="metadata"
                  src={activeItem.file}
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayIcon className="h-[72px] w-[60px] md:h-[120px] md:w-[100px]" />
                </div>
              </>
            ) : (
              <div className="relative h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative shrink-0"
                    style={{
                      height: activeImageLayout ? `${activeImageLayout.height}px` : `calc(100% - ${ACTIVE_MEDIA_MIN_PADDING * 2}px)`,
                      width: activeImageLayout ? `${activeImageLayout.width}px` : `calc(100% - ${ACTIVE_MEDIA_MIN_PADDING * 2}px)`,
                    }}
                  >
                    <FillImage
                      alt={activeItem.alt}
                      className="object-contain object-center"
                      sizes="(min-width: 1024px) 557px, 100vw"
                      src={activeItem.previewFile}
                      variant={mainImageVariant}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeItem.kind === "image" ? (
            <>
              <div className="pointer-events-none absolute inset-0 hidden bg-black/10 opacity-0 transition-opacity md:block md:group-hover:opacity-100 md:group-focus-visible:opacity-100" />
              <div className="pointer-events-none absolute inset-x-0 bottom-10 hidden justify-center opacity-0 transition-opacity md:flex md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                <div className="flex items-center gap-2 rounded-[8px] bg-white px-4 py-3 shadow-[0px_1px_4px_rgba(12,12,13,0.1),0px_1px_4px_rgba(12,12,13,0.05)]">
                  <ExpandIcon />
                  <span className="font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.25] text-[var(--cp-primary-500)]">
                    {expandLabel}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </button>
      </div>

      <MediaLightbox
        index={lightboxIndex ?? 0}
        items={lightboxItems}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(index) => {
          setLightboxIndex(index);
          const item = items[index];
          if (item) setActiveId(item.id);
        }}
        open={lightboxIndex !== null}
      />
    </>
  );
}
