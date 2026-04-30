"use client";

import { useMemo } from "react";
import Lightbox, { type Slide } from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";

export interface MediaLightboxItem {
  alt?: string;
  poster?: string;
  src: string;
  type?: "image" | "video";
  videoType?: string;
}

const VIDEO_EXTENSION_PATTERN = /\.(mp4|m4v|mov|webm|ogv|ogg)(?:[?#].*)?$/i;

export function isVideoFile(src: string): boolean {
  return VIDEO_EXTENSION_PATTERN.test(src.trim());
}

function inferVideoMimeType(src: string): string {
  const normalized = src.split("?")[0].split("#")[0].toLowerCase();

  if (normalized.endsWith(".webm")) return "video/webm";
  if (normalized.endsWith(".ogv") || normalized.endsWith(".ogg")) return "video/ogg";
  if (normalized.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}

function toLightboxSlide(item: MediaLightboxItem): Slide {
  const type = item.type || (isVideoFile(item.src) ? "video" : "image");

  if (type === "video") {
    return {
      type: "video",
      autoPlay: true,
      controls: true,
      playsInline: true,
      poster: item.poster && !isVideoFile(item.poster) ? item.poster : undefined,
      preload: "metadata",
      sources: [
        {
          src: item.src,
          type: item.videoType || inferVideoMimeType(item.src),
        },
      ],
    };
  }

  return {
    alt: item.alt || "",
    src: item.src,
  };
}

interface MediaLightboxProps {
  index: number;
  items: MediaLightboxItem[];
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  open: boolean;
}

export default function MediaLightbox({ index, items, onClose, onIndexChange, open }: MediaLightboxProps) {
  const slides = useMemo(() => items.map((item) => toLightboxSlide(item)), [items]);

  if (!items.length) return null;

  return (
    <Lightbox
      animation={{ fade: 180, swipe: 360 }}
      carousel={{
        finite: true,
        imageFit: "contain",
        padding: "16px",
        preload: 1,
        spacing: "18%",
      }}
      close={onClose}
      controller={{ closeOnBackdropClick: true }}
      index={Math.min(Math.max(index, 0), items.length - 1)}
      labels={{
        Close: "Close preview",
        Lightbox: "Media preview",
        Next: "Next media",
        Previous: "Previous media",
        "Photo gallery": "Media gallery",
      }}
      on={{ view: ({ index: currentIndex }) => onIndexChange?.(currentIndex) }}
      open={open}
      plugins={[Video]}
      slides={slides}
      styles={{
        button: {
          color: "rgba(255,255,255,0.92)",
        },
        container: {
          backgroundColor: "#000",
        },
      }}
      video={{
        controls: true,
        playsInline: true,
        preload: "metadata",
      }}
    />
  );
}
