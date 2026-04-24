"use client";

import { tinaField } from "tinacms/dist/react";
import ProductRelatedProducts from "@/components/special/catalog-product/ProductRelatedProducts";
import {
  getCountertopReferenceFocusItemId,
  TINA_LIST_KEY_COUNTERTOP_RELATED_PRODUCTS,
} from "@/lib/tina-list-focus";
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
          focusItemId: getCountertopReferenceFocusItemId(item.relation?.product),
          tinaField: relationRecord ? tinaField(relationRecord, "product") || undefined : undefined,
        };
      })}
      focusListKey={TINA_LIST_KEY_COUNTERTOP_RELATED_PRODUCTS}
      focusRootFieldName={sectionTinaField}
      sectionTinaField={undefined}
      title={title}
      titleTinaField={titleTinaField}
    />
  );
}
