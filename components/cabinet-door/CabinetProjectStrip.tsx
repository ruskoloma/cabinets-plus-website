"use client";

import { tinaField } from "tinacms/dist/react";
import ProductProjectStrip from "@/components/catalog-product/ProductProjectStrip";
import type { CabinetProjectItem } from "./types";

interface CabinetProjectStripProps {
  items: CabinetProjectItem[];
  title: string;
  description: string;
  titleTinaField?: string;
  descriptionTinaField?: string;
  imageSizeChoice?: string | null;
}

export default function CabinetProjectStrip({
  items,
  title,
  description,
  titleTinaField,
  descriptionTinaField,
  imageSizeChoice,
}: CabinetProjectStripProps) {
  return (
    <ProductProjectStrip
      description={description}
      descriptionTinaField={descriptionTinaField}
      imageSizeChoice={imageSizeChoice}
      items={items.map((project) => ({
        file: project.file,
        title: project.title,
        href: project.href,
        imageTinaField: project.mediaSource
          ? tinaField(project.mediaSource, "file") || undefined
          : project.source
            ? tinaField(project.source as unknown as Record<string, unknown>, "file") || undefined
            : undefined,
        titleTinaField: project.projectSource
          ? tinaField(project.projectSource, "title") || undefined
          : project.source
            ? tinaField(project.source as unknown as Record<string, unknown>, "label") || undefined
            : undefined,
      }))}
      title={title}
      titleTinaField={titleTinaField}
    />
  );
}
