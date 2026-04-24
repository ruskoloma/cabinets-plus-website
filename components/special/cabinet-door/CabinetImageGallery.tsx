"use client";

import { tinaField } from "tinacms/dist/react";
import ProductMediaGallery from "@/components/special/catalog-product/ProductMediaGallery";
import { getTinaSidebarMediaItemId } from "@/lib/tina-media-focus";
import type { CabinetData, CabinetGalleryItem } from "./types";

interface CabinetImageGalleryProps {
  cabinet: CabinetData;
  items: CabinetGalleryItem[];
  thumbImageSizeChoice?: string | null;
  mainImageSizeChoice?: string | null;
  lightboxImageSizeChoice?: string | null;
  focusRootFieldName?: string;
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
  focusRootFieldName,
}: CabinetImageGalleryProps) {
  return (
    <ProductMediaGallery
      items={items.map((item, index) => ({
        id: `${item.sourceType}-${item.file}-${index}`,
        kind: "image" as const,
        file: item.file,
        previewFile: item.file,
        alt: cabinet.name || "Cabinet door",
        focusMediaItemId: item.sourceType === "media" ? getTinaSidebarMediaItemId(item.file) : undefined,
        tinaField: getTinaFieldValue(cabinet, item),
      }))}
      focusRootFieldName={focusRootFieldName}
      lightboxImageSizeChoice={lightboxImageSizeChoice}
      mainImageSizeChoice={mainImageSizeChoice}
      productName={cabinet.name || "Cabinet door"}
      thumbImageSizeChoice={thumbImageSizeChoice}
    />
  );
}
