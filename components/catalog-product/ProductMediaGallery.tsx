"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function ProductMediaGallery({
  items,
  productName,
  expandLabel = "Click to expand",
}: ProductMediaGalleryProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) || items[0] || null,
    [activeId, items],
  );

  if (!activeItem) return null;

  const openLightbox = () => setLightboxOpen(true);

  return (
    <>
      <div className="flex flex-col-reverse gap-5 lg:flex-row lg:gap-7">
        <div className="cp-hide-scrollbar flex flex-shrink-0 gap-4 overflow-x-auto pb-1 lg:h-[557px] lg:w-fit lg:flex-col lg:items-start lg:gap-[29px] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-2">
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
                <img alt="" aria-hidden className="h-full w-full object-cover" src={item.previewFile} />
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
          className="group relative block w-full max-w-[557px] overflow-hidden bg-[#fafafa] text-left"
          onClick={openLightbox}
          type="button"
        >
          <div className="aspect-square w-full">
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
              <img alt={activeItem.alt} className="h-full w-full object-contain p-[11.8%]" data-tina-field={activeItem.tinaField} src={activeItem.previewFile} />
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
              <img alt={activeItem.alt} className="max-h-[85vh] w-full rounded-[4px] object-contain" src={activeItem.file} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
