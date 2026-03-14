"use client";

import { tinaField } from "tinacms/dist/react";
import ProductProjectStrip from "@/components/catalog-product/ProductProjectStrip";
import type { CabinetProjectItem } from "./types";

interface CabinetProjectStripProps {
  items: CabinetProjectItem[];
  title: string;
  description: string;
}

export default function CabinetProjectStrip({ items, title, description }: CabinetProjectStripProps) {
  return (
    <ProductProjectStrip
      description={description}
      items={items.map((project) => ({
        file: project.file,
        title: project.title,
        imageTinaField: project.source ? tinaField(project.source as unknown as Record<string, unknown>, "file") : undefined,
        titleTinaField: project.source ? tinaField(project.source as unknown as Record<string, unknown>, "label") : undefined,
      }))}
      title={title}
    />
  );
}
