"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getImageVariantSources, isVectorAsset, type ImageVariantPreset } from "@/lib/image-variants";

type FillImageProps = Omit<ImageProps, "fill" | "src"> & {
  src: string;
  variant?: ImageVariantPreset;
};

export default function FillImage({ alt, sizes, src, unoptimized, variant, ...props }: FillImageProps) {
  const { fallbackSrc, preferredSrc } = useMemo(() => getImageVariantSources(src, variant), [src, variant]);
  const [currentSrc, setCurrentSrc] = useState(preferredSrc);

  useEffect(() => {
    setCurrentSrc(preferredSrc);
  }, [preferredSrc]);

  return (
    <Image
      alt={alt}
      fill
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      sizes={sizes}
      src={currentSrc}
      unoptimized={unoptimized ?? isVectorAsset(currentSrc)}
      {...props}
    />
  );
}
