"use client";

import { tinaField } from "tinacms/dist/react";
import ProductRelatedProducts from "@/components/catalog-product/ProductRelatedProducts";
import type { CabinetRelatedItem } from "./types";

interface CabinetRelatedProductsProps {
  items: CabinetRelatedItem[];
  title: string;
  imageSizeChoice?: string | null;
  titleTinaField?: string;
}

export default function CabinetRelatedProducts({
  items,
  title,
  imageSizeChoice,
  titleTinaField,
}: CabinetRelatedProductsProps) {
  return (
    <ProductRelatedProducts
      imageSizeChoice={imageSizeChoice}
      titleTinaField={titleTinaField}
      items={items.map((item) => {
        const relationRecord = item.relation as unknown as Record<string, unknown> | undefined;

        return {
          href: `/cabinets/${item.slug}`,
          name: item.name,
          code: item.code,
          image: item.image,
          tinaField: relationRecord ? tinaField(relationRecord, "product") || undefined : undefined,
        };
      })}
      title={title}
    />
  );
}
