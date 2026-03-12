"use client";

import { tinaField } from "tinacms/dist/react";
import type { CabinetProjectItem } from "./types";

interface CabinetProjectStripProps {
  items: CabinetProjectItem[];
  title: string;
  description: string;
}

export default function CabinetProjectStrip({ items, title, description }: CabinetProjectStripProps) {
  if (!items.length) return null;

  return (
    <section className="bg-[var(--cp-brand-neutral-50)]">
      <div className="cp-container px-4 py-14 md:px-8 md:py-16">
        <h2 className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)]">
          {title}
        </h2>
        <p className="mt-3 max-w-[1024px] text-[24px] leading-[1.5] text-[var(--cp-primary-500)]">
          {description}
        </p>

        <div className="cp-hide-scrollbar mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-5 md:gap-8">
            {items.map((project, index) => (
              <article className="w-[300px] md:w-[426px]" key={`${project.file}-${index}`}>
                <div
                  className="h-[220px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[312px]"
                  data-tina-field={project.source ? tinaField(project.source as unknown as Record<string, unknown>, "file") : undefined}
                >
                  <img alt={project.title} className="h-full w-full object-cover" src={project.file} />
                </div>
                <p
                  className="mt-3 font-[var(--font-red-hat-display)] text-[24px] font-semibold leading-[1.25] text-[var(--cp-primary-500)]"
                  data-tina-field={project.source ? tinaField(project.source as unknown as Record<string, unknown>, "label") : undefined}
                >
                  {project.title}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
