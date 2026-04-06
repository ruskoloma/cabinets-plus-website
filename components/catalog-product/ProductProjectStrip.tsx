"use client";

import Link from "next/link";
import { useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ProductProjectCardItem } from "./types";

interface ProductProjectStripProps {
  items: ProductProjectCardItem[];
  title: string;
  description: string;
  titleTinaField?: string;
  descriptionTinaField?: string;
  sectionTinaField?: string;
  imageSizeChoice?: string | null;
}

export default function ProductProjectStrip({
  items,
  title,
  description,
  titleTinaField,
  descriptionTinaField,
  sectionTinaField,
  imageSizeChoice,
}: ProductProjectStripProps) {
  const { edit } = useEditState();
  const projectImageVariant = resolveConfiguredImageVariant(imageSizeChoice, "card");
  if (!items.length) return null;

  return (
    <section className="bg-white" data-tina-field={sectionTinaField}>
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
            {items.map((project, index) => (
              <article className="w-[173px] md:w-[426px]" key={`${project.file}-${index}`}>
                {project.href ? (
                  <Link
                    className="group block"
                    data-tina-field={project.selectionTinaField}
                    href={project.href}
                    onClick={(event) => {
                      if (edit) {
                        event.preventDefault();
                      }
                    }}
                  >
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
                  </Link>
                ) : (
                  <div data-tina-field={project.selectionTinaField}>
                    <div className="relative h-[173px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[312px]">
                      <FillImage alt={project.title} className="object-cover" sizes="(min-width: 768px) 426px, 173px" src={project.file} variant={projectImageVariant} />
                    </div>
                    <div className="mt-2 flex w-full items-start justify-between gap-2 md:mt-3">
                      <p className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
                        {project.title}
                      </p>
                      <img alt="" aria-hidden className="mt-[1px] h-4 w-4 shrink-0 md:hidden" src="/library/header/nav-chevron-right.svg" />
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
