"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import {
  focusTinaSidebarListItem,
  TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME,
} from "@/lib/tina-list-focus";
import { useTinaQuickEditEnabled } from "@/lib/use-tina-quick-edit-enabled";
import type { ProductProjectCardItem } from "./types";

interface ProductProjectStripProps {
  items: ProductProjectCardItem[];
  title: string;
  description: string;
  titleTinaField?: string;
  descriptionTinaField?: string;
  sectionTinaField?: string;
  imageSizeChoice?: string | null;
  focusListKey?: string;
  focusRootFieldName?: string;
}

// `sectionTinaField` in props is intentionally ignored: we do NOT put data-tina-field on the
// outer section (or on project cards) so clicks on cards can focus the product's
// relatedProjects list row via the custom postMessage channel, instead of Tina's native
// handler walking up and focusing the page-settings block.
export default function ProductProjectStrip({
  items,
  title,
  description,
  titleTinaField,
  descriptionTinaField,
  imageSizeChoice,
  focusListKey,
  focusRootFieldName,
}: ProductProjectStripProps) {
  const { edit } = useEditState();
  const quickEditEnabled = useTinaQuickEditEnabled();
  const projectImageVariant = resolveConfiguredImageVariant(imageSizeChoice, "card");
  const canUseCustomFocus = Boolean(edit && quickEditEnabled && focusListKey);
  if (!items.length) return null;

  return (
    <section className="bg-white">
      <div className="cp-container px-4 py-12 md:px-8 md:py-16">
        <h2
          className="font-[var(--font-red-hat-display)] text-[28px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]"
          data-tina-field={titleTinaField}
        >
          {title}
        </h2>
        <p
          className="mt-3 max-w-[1024px] text-[18px] leading-[1.5] text-[var(--cp-primary-500)] md:text-[24px]"
          data-tina-field={descriptionTinaField}
        >
          {description}
        </p>

        <div className="cp-hide-scrollbar mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-5 md:gap-8">
            {items.map((project, index) => {
              const cardClassName = canUseCustomFocus
                ? `group block ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
                : "group block";
              const handleClick = (event: MouseEvent<HTMLElement>) => {
                if (!edit) return;

                event.preventDefault();
                event.stopPropagation();

                if (!focusListKey) return;

                focusTinaSidebarListItem({
                  rootFieldName: focusRootFieldName,
                  listKey: focusListKey,
                  itemId: project.focusItemId,
                });
              };

              const content = (
                <>
                  <div className="relative h-[173px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[312px]">
                    <FillImage
                      alt={project.title}
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(min-width: 768px) 426px, 173px"
                      src={project.file}
                      variant={projectImageVariant}
                    />
                  </div>
                  <div className="mt-2 flex w-full items-start justify-between gap-2 md:mt-3">
                    <p className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] transition-colors group-hover:text-[var(--cp-accent-700)] md:text-[24px]">
                      {project.title}
                    </p>
                    <img alt="" aria-hidden className="mt-[1px] h-4 w-4 shrink-0 md:hidden" src="/library/header/nav-chevron-right.svg" />
                  </div>
                </>
              );

              return (
                <article className="w-[173px] md:w-[426px]" key={`${project.file}-${index}`}>
                  {project.href ? (
                    <Link className={cardClassName} href={project.href} onClick={handleClick}>
                      {content}
                    </Link>
                  ) : (
                    <div
                      className={canUseCustomFocus ? TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME : undefined}
                      onClick={canUseCustomFocus ? handleClick : undefined}
                    >
                      {content}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
