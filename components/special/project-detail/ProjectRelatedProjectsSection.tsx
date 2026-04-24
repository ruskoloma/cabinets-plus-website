"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useMemo } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import type { GalleryOverviewDataShape } from "@/components/special/gallery-overview/types";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import {
  focusTinaSidebarListItem,
  TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME,
} from "@/lib/tina-list-focus";
import { useTinaQuickEditEnabled } from "@/lib/use-tina-quick-edit-enabled";
import { buildRelatedProjectCards } from "./helpers";
import type { ProjectOverviewItem } from "./types";

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

interface ProjectRelatedProjectsSectionProps {
  block?: Record<string, unknown> | null;
  project: ProjectOverviewItem;
  overviewData: GalleryOverviewDataShape;
}

export default function ProjectRelatedProjectsSection({
  block,
  project,
  overviewData,
}: ProjectRelatedProjectsSectionProps) {
  const { edit } = useEditState();
  const quickEditEnabled = useTinaQuickEditEnabled();
  const rawProject = project as unknown as Record<string, unknown>;
  const projectFieldName = tinaField(rawProject) || undefined;

  const titleText = (readStringField(block, "title") || "").trim() || "Projects You Might Like";
  const ctaLabelText = (readStringField(block, "ctaLabel") || "").trim() || "View all";
  const ctaLinkText = (readStringField(block, "ctaLink") || "").trim() || "/gallery";
  const imageSizeChoice = readStringField(block, "imageSize");
  const imageVariant: ImageVariantPreset | undefined = resolveConfiguredImageVariant(imageSizeChoice, "card");

  const relatedProjects = useMemo(
    () => buildRelatedProjectCards(project, overviewData, tinaField),
    [project, overviewData],
  );

  if (relatedProjects.length === 0) return null;

  // No data-tina-field on any ancestor of the cards: clicks rely entirely on the custom
  // postMessage channel so Tina focuses the current project's `relatedProjects` list and
  // scrolls/highlights the clicked row — instead of navigating into the linked project doc.
  return (
    <section className="bg-white">
      <div className="cp-container px-4 py-[72px] md:px-8 md:py-16">
        <h2
          className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]"
          data-tina-field={block ? tinaField(block, "title") || undefined : undefined}
        >
          {titleText}
        </h2>

        <div className="cp-hide-scrollbar mt-10 flex snap-x gap-5 overflow-x-auto md:mt-8 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible">
          {relatedProjects.map((item) => {
            const useCustomFocus = Boolean(edit && quickEditEnabled && item.focusListKey);
            const className = useCustomFocus
              ? `group block w-[173px] shrink-0 snap-start transition-opacity hover:opacity-90 md:w-auto ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
              : "group block w-[173px] shrink-0 snap-start transition-opacity hover:opacity-90 md:w-auto";

            const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
              if (!edit) return;

              event.preventDefault();
              event.stopPropagation();

              if (!item.focusListKey) return;

              focusTinaSidebarListItem({
                rootFieldName: projectFieldName,
                listKey: item.focusListKey,
                itemId: item.focusItemId,
              });
            };

            return (
              <Link
                className={className}
                href={`/projects/${item.slug}`}
                key={item.slug}
                onClick={handleClick}
              >
                <div className="relative h-[173px] w-full overflow-hidden bg-[var(--cp-primary-100)] md:h-[330px]">
                  <FillImage alt={item.title} className="object-cover" sizes="(min-width: 768px) 33vw, 173px" src={item.image} variant={imageVariant} />
                </div>
                <div className="mt-2 flex items-start justify-between gap-2 md:mt-3 md:block">
                  <p className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
                    {item.title}
                  </p>
                  <img alt="" aria-hidden className="mt-[1px] h-4 w-4 shrink-0 md:hidden" src="/library/header/nav-chevron-right.svg" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center md:mt-8">
          <Button
            className="!h-12 !px-8 !text-[20px]"
            dataTinaField={block ? tinaField(block, "ctaLabel") || undefined : undefined}
            href={ctaLinkText}
            size="small"
            variant="secondary"
          >
            {ctaLabelText}
          </Button>
        </div>
      </div>
    </section>
  );
}
