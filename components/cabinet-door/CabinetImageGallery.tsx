"use client";

import { tinaField } from "tinacms/dist/react";
import ProductMediaGallery from "@/components/catalog-product/ProductMediaGallery";
import type { CabinetData, CabinetGalleryItem } from "./types";

interface CabinetImageGalleryProps {
  cabinet: CabinetData;
  items: CabinetGalleryItem[];
  thumbImageSizeChoice?: string | null;
  mainImageSizeChoice?: string | null;
  lightboxImageSizeChoice?: string | null;
}

function getTinaFieldValue(cabinet: CabinetData, item: CabinetGalleryItem): string | undefined {
  if (item.sourceType === "picture") {
    return tinaField(cabinet as unknown as Record<string, unknown>, "picture");
  }

  if (item.source) {
    return tinaField(item.source as unknown as Record<string, unknown>, "file");
  }

  return undefined;
}

export default function CabinetImageGallery({
  cabinet,
  items,
  thumbImageSizeChoice,
  mainImageSizeChoice,
  lightboxImageSizeChoice,
}: CabinetImageGalleryProps) {
  return (
    <ProductMediaGallery
      items={items.map((item, index) => ({
        id: `${item.sourceType}-${item.file}-${index}`,
        kind: "image" as const,
        file: item.file,
        previewFile: item.file,
        alt: cabinet.name || "Cabinet door",
        tinaField: getTinaFieldValue(cabinet, item),
      }))}
      lightboxImageSizeChoice={lightboxImageSizeChoice}
      mainImageSizeChoice={mainImageSizeChoice}
      productName={cabinet.name || "Cabinet door"}
      thumbImageSizeChoice={thumbImageSizeChoice}
    />
  );
}
