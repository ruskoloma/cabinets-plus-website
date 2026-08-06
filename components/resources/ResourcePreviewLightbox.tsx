"use client";

import { useMemo } from "react";
import Lightbox, { type Slide } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

export interface ResourcePreviewSlide {
  alt: string;
  src: string;
}

interface ResourcePreviewLightboxProps {
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  open: boolean;
  /** Shows the filmstrip — worth it for a magazine, noise for a two-pager. */
  showThumbnails?: boolean;
  slides: ResourcePreviewSlide[];
  title?: string;
}

/**
 * Page viewer for magazines and brochures.
 *
 * The pages are pre-rendered WebP images rather than the PDF itself: a PDF in
 * an iframe shows only its first page in iOS Safari, loads the whole file
 * before the first paint, and cannot be styled. Images stream one spread at a
 * time, zoom natively, and the original PDF stays one click away.
 */
export default function ResourcePreviewLightbox({
  index,
  onClose,
  onIndexChange,
  open,
  showThumbnails = false,
  slides,
  title,
}: ResourcePreviewLightboxProps) {
  const lightboxSlides = useMemo<Slide[]>(
    () => slides.map((slide) => ({ alt: slide.alt, src: slide.src })),
    [slides],
  );

  const plugins = useMemo(
    () => (showThumbnails ? [Counter, Thumbnails, Zoom] : [Counter, Zoom]),
    [showThumbnails],
  );

  if (!slides.length) return null;

  return (
    <Lightbox
      animation={{ fade: 180, swipe: 360 }}
      carousel={{ finite: true, imageFit: "contain", padding: "16px", preload: 2, spacing: "12%" }}
      close={onClose}
      controller={{ closeOnBackdropClick: true }}
      index={Math.min(Math.max(index, 0), slides.length - 1)}
      labels={{
        Close: "Close preview",
        Lightbox: title || "Document preview",
        Next: "Next page",
        Previous: "Previous page",
      }}
      on={{ view: ({ index: currentIndex }) => onIndexChange?.(currentIndex) }}
      open={open}
      plugins={plugins}
      slides={lightboxSlides}
      styles={{
        button: { color: "rgba(255,255,255,0.92)" },
        container: { backgroundColor: "rgba(20,20,19,0.97)" },
      }}
      thumbnails={{ border: 0, gap: 8, height: 72, padding: 0, width: 108 }}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
    />
  );
}
