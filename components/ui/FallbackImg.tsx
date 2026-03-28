/* eslint-disable @next/next/no-img-element */

"use client";

import { type ImgHTMLAttributes, useEffect, useMemo, useState } from "react";
import { getImageVariantSources, type ImageVariantPreset } from "@/lib/image-variants";

type FallbackImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  alt: string;
  src: string;
  variant?: ImageVariantPreset;
};

export default function FallbackImg({ alt, src, variant, onError, ...props }: FallbackImgProps) {
  const { fallbackSrc, preferredSrc } = useMemo(() => getImageVariantSources(src, variant), [src, variant]);
  const [currentSrc, setCurrentSrc] = useState(preferredSrc);

  useEffect(() => {
    setCurrentSrc(preferredSrc);
  }, [preferredSrc]);

  return (
    <img
      {...props}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }

        onError?.(event);
      }}
      src={currentSrc}
    />
  );
}
