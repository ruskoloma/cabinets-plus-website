/* eslint-disable @next/next/no-img-element */

"use client";

import { type ImgHTMLAttributes, useEffect, useMemo, useState } from "react";
import { getImageVariantSources, normalizeImageSrc, type ImageVariantPreset } from "@/lib/image-variants";

type FallbackImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  alt: string;
  fallbackSrc?: string | null;
  src?: string | null;
  variant?: ImageVariantPreset;
};

export default function FallbackImg({ alt, fallbackSrc, src, variant, onError, ...props }: FallbackImgProps) {
  const normalizedFallbackSrc = useMemo(() => normalizeImageSrc(fallbackSrc), [fallbackSrc]);
  const normalizedSrc = useMemo(() => normalizeImageSrc(src) || normalizedFallbackSrc, [normalizedFallbackSrc, src]);
  const sources = useMemo(() => (normalizedSrc ? getImageVariantSources(normalizedSrc, variant) : null), [normalizedSrc, variant]);
  const preferredSrc = sources?.preferredSrc || "";
  const sourceFallbackSrc = sources?.fallbackSrc || "";
  const [currentSrc, setCurrentSrc] = useState(preferredSrc);

  useEffect(() => {
    setCurrentSrc(preferredSrc);
  }, [preferredSrc]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !src || normalizeImageSrc(src)) return;
    console.warn("Invalid image src skipped", src);
  }, [src]);

  if (!sources || !currentSrc) return null;

  return (
    <img
      {...props}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== sourceFallbackSrc) {
          setCurrentSrc(sourceFallbackSrc);
        } else if (normalizedFallbackSrc && currentSrc !== normalizedFallbackSrc) {
          setCurrentSrc(normalizedFallbackSrc);
        }

        onError?.(event);
      }}
      src={currentSrc}
    />
  );
}
