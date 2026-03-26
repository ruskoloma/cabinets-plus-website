"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FillImage from "@/components/ui/FillImage";
import type { ProductGalleryItemViewModel } from "./types";

interface ProductMediaGalleryProps {
  items: ProductGalleryItemViewModel[];
  productName: string;
  expandLabel?: string;
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

function CloseIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

const ACTIVE_MEDIA_MIN_PADDING = 12;
const ACTIVE_MEDIA_PREFERRED_PADDING = 65;

export default function ProductMediaGallery({
  items,
  productName,
  expandLabel = "Click to expand",
}: ProductMediaGalleryProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [frameSize, setFrameSize] = useState(0);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const activeMediaFrameRef = useRef<HTMLDivElement | null>(null);
  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) || items[0] || null,
    [activeId, items],
  );

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const pendingImages = items.filter((item) => item.kind === "image" && !imageAspectRatios[item.id]);
    if (!pendingImages.length) return undefined;

    let cancelled = false;

    pendingImages.forEach((item) => {
      const image = new window.Image();
      image.src = item.previewFile;
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
  }, [imageAspectRatios, items]);

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

  const openLightbox = () => setLightboxOpen(true);

  return (
    <>
      <div className="flex flex-col-reverse gap-5 lg:flex-row lg:gap-7">
        <div className="cp-hide-scrollbar flex flex-shrink-0 gap-4 overflow-x-auto pb-1 lg:h-[557px] lg:w-fit lg:flex-col lg:items-start lg:gap-[29px] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
          {items.map((item, index) => {
            const isActive = activeItem.id === item.id;

            return (
              <button
                aria-label={`Show ${item.kind === "video" ? "video" : "image"} ${index + 1}`}
                className={`relative h-[90px] w-[90px] shrink-0 overflow-hidden border bg-[#fafafa] transition ${isActive ? "border-[var(--cp-primary-500)]" : "border-transparent"}`}
                data-tina-field={item.tinaField}
                key={item.id}
                onClick={() => setActiveId(item.id)}
                type="button"
              >
                <FillImage alt="" aria-hidden className="object-cover" sizes="90px" src={item.previewFile} />
                {item.kind === "video" ? (
                  <>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayIcon className="h-7 w-6" />
                    </div>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          aria-label={activeItem.kind === "video" ? `Open video for ${productName}` : `Expand image for ${productName}`}
          className="group relative block h-auto w-full max-w-[557px] overflow-hidden bg-[#fafafa] text-left lg:h-[557px] lg:w-[557px] lg:max-w-none lg:shrink-0"
          onClick={openLightbox}
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
                  poster={activeItem.previewFile}
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
                      data-tina-field={activeItem.tinaField}
                      sizes="(min-width: 1024px) 557px, 100vw"
                      src={activeItem.previewFile}
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

      {lightboxOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
        >
          <button
            aria-label="Close preview"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--cp-primary-500)] transition hover:bg-white"
            onClick={() => setLightboxOpen(false)}
            type="button"
          >
            <CloseIcon />
          </button>

          <div className="max-h-[90vh] max-w-[min(95vw,1200px)]" onClick={(event) => event.stopPropagation()}>
            {activeItem.kind === "video" ? (
              <video
                autoPlay
                className="max-h-[85vh] w-full max-w-[min(95vw,1100px)] rounded-[4px] bg-black object-contain"
                controls
                playsInline
                poster={activeItem.previewFile}
                src={activeItem.file}
              />
            ) : (
              <div className="relative h-[min(85vh,900px)] w-[min(95vw,1100px)]">
                <FillImage alt={activeItem.alt} className="rounded-[4px] object-contain" sizes="95vw" src={activeItem.file} />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
