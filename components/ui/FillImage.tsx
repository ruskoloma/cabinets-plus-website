"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getImageVariantSources, isVectorAsset, normalizeImageSrc, type ImageVariantPreset } from "@/lib/image-variants";

type FillImageProps = Omit<ImageProps, "fill" | "src"> & {
  fallbackSrc?: string | null;
  src?: string | null;
  variant?: ImageVariantPreset;
};

export default function FillImage({ alt, fallbackSrc, onError, sizes, src, unoptimized, variant, ...props }: FillImageProps) {
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
    <Image
      alt={alt}
      fill
      onError={(event) => {
        if (currentSrc !== sourceFallbackSrc) {
          setCurrentSrc(sourceFallbackSrc);
        } else if (normalizedFallbackSrc && currentSrc !== normalizedFallbackSrc) {
          setCurrentSrc(normalizedFallbackSrc);
        }

        onError?.(event);
      }}
      sizes={sizes}
      src={currentSrc}
      unoptimized={unoptimized ?? (currentSrc.startsWith("data:image/") || isVectorAsset(currentSrc))}
      {...props}
    />
  );
}
