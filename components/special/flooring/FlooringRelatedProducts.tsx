"use client";

import { tinaField } from "tinacms/dist/react";
import ProductRelatedProducts from "@/components/special/catalog-product/ProductRelatedProducts";
import {
  getFlooringReferenceFocusItemId,
  TINA_LIST_KEY_FLOORING_RELATED_PRODUCTS,
} from "@/lib/tina-list-focus";
import type { FlooringRelatedItem } from "./types";

interface FlooringRelatedProductsProps {
  items: FlooringRelatedItem[];
  title: string;
  imageSizeChoice?: string | null;
  titleTinaField?: string;
  sectionTinaField?: string;
}

export default function FlooringRelatedProducts({
  items,
  title,
  imageSizeChoice,
  titleTinaField,
  sectionTinaField,
}: FlooringRelatedProductsProps) {
  return (
    <ProductRelatedProducts
      imageSizeChoice={imageSizeChoice}
      items={items.map((item) => {
        const relationRecord = item.relation as unknown as Record<string, unknown> | undefined;

        return {
          href: `/flooring/catalog/${item.slug}`,
          name: item.name,
          code: item.code,
          image: item.image,
          focusItemId: getFlooringReferenceFocusItemId(item.relation?.product),
          tinaField: relationRecord ? tinaField(relationRecord, "product") || undefined : undefined,
        };
      })}
      focusListKey={TINA_LIST_KEY_FLOORING_RELATED_PRODUCTS}
      focusRootFieldName={sectionTinaField}
      sectionTinaField={undefined}
      title={title}
      titleTinaField={titleTinaField}
    />
  );
}
