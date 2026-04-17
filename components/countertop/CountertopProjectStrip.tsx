"use client";

import { tinaField } from "tinacms/dist/react";
import ProductProjectStrip from "@/components/catalog-product/ProductProjectStrip";
import {
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import type { CountertopProjectItem } from "./types";

interface CountertopProjectStripProps {
  items: CountertopProjectItem[];
  title: string;
  description: string;
  titleTinaField?: string;
  descriptionTinaField?: string;
  sectionTinaField?: string;
  imageSizeChoice?: string | null;
  selectionSourceRecord?: Record<string, unknown> | null;
  selectionListTinaField?: string;
}

export default function CountertopProjectStrip({
  items,
  title,
  description,
  titleTinaField,
  descriptionTinaField,
  sectionTinaField,
  imageSizeChoice,
  selectionSourceRecord,
  selectionListTinaField,
}: CountertopProjectStripProps) {
  return (
    <ProductProjectStrip
      description={description}
      descriptionTinaField={descriptionTinaField}
      imageSizeChoice={imageSizeChoice}
      items={items.map((project) => ({
        file: project.file,
        title: project.title,
        href: project.href,
        focusItemId: project.projectSource ? getProjectReferenceFocusItemId(project.projectSource) : undefined,
        selectionTinaField:
          selectionSourceRecord && typeof project.selectionIndex === "number"
            ? tinaField(selectionSourceRecord, `relatedProjects.${project.selectionIndex}.project`) || undefined
            : selectionListTinaField,
        imageTinaField: project.mediaSource
          ? tinaField(project.mediaSource, "file") || undefined
          : project.media
            ? tinaField(project.media as unknown as Record<string, unknown>, "file") || undefined
            : project.project
              ? tinaField(project.project as unknown as Record<string, unknown>, "media.0.file") || undefined
              : undefined,
        titleTinaField: project.projectSource
          ? tinaField(project.projectSource, "title") || undefined
          : project.media
            ? tinaField(project.media as unknown as Record<string, unknown>, "label") ||
              tinaField(project.media as unknown as Record<string, unknown>, "altText") ||
              undefined
            : project.project
              ? tinaField(project.project as unknown as Record<string, unknown>, "title") || undefined
              : undefined,
      }))}
      focusListKey={TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS}
      focusRootFieldName={sectionTinaField}
      sectionTinaField={sectionTinaField}
      title={title}
      titleTinaField={titleTinaField}
    />
  );
}
