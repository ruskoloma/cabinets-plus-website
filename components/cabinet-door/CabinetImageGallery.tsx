"use client";

import { tinaField } from "tinacms/dist/react";
import ProductMediaGallery from "@/components/catalog-product/ProductMediaGallery";
import type { CabinetData, CabinetGalleryItem } from "./types";

interface CabinetImageGalleryProps {
  cabinet: CabinetData;
  items: CabinetGalleryItem[];
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

export default function CabinetImageGallery({ cabinet, items }: CabinetImageGalleryProps) {
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
      productName={cabinet.name || "Cabinet door"}
    />
  );
}
