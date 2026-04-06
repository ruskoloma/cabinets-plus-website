"use client";

import { tinaField } from "tinacms/dist/react";
import ProductRelatedProducts from "@/components/catalog-product/ProductRelatedProducts";
import type { CountertopRelatedItem } from "./types";

interface CountertopRelatedProductsProps {
  items: CountertopRelatedItem[];
  title: string;
  imageSizeChoice?: string | null;
  titleTinaField?: string;
  sectionTinaField?: string;
}

export default function CountertopRelatedProducts({
  items,
  title,
  imageSizeChoice,
  titleTinaField,
  sectionTinaField,
}: CountertopRelatedProductsProps) {
  return (
    <ProductRelatedProducts
      imageSizeChoice={imageSizeChoice}
      items={items.map((item) => {
        const relationRecord = item.relation as unknown as Record<string, unknown> | undefined;

        return {
          href: `/countertops/${item.slug}`,
          name: item.name,
          code: item.code,
          image: item.image,
          tinaField: relationRecord ? tinaField(relationRecord, "product") || undefined : undefined,
        };
      })}
      sectionTinaField={sectionTinaField}
      title={title}
      titleTinaField={titleTinaField}
    />
  );
}
