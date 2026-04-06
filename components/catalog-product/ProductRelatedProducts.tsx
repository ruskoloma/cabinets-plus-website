"use client";

import Link from "next/link";
import { useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ProductRelatedCardItem } from "./types";

interface ProductRelatedProductsProps {
  items: ProductRelatedCardItem[];
  title: string;
  imageSizeChoice?: string | null;
  titleTinaField?: string;
  sectionTinaField?: string;
}

function formatProductCode(code?: string): string {
  if (!code?.trim()) return "";
  return `#${code.replace(/^#+/, "").trim()}`;
}

export default function ProductRelatedProducts({
  items,
  title,
  imageSizeChoice,
  titleTinaField,
  sectionTinaField,
}: ProductRelatedProductsProps) {
  const { edit } = useEditState();
  const relatedImageVariant = resolveConfiguredImageVariant(imageSizeChoice, "card");
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

        <div className="cp-hide-scrollbar mt-6 overflow-x-auto pb-2 md:mt-10 md:overflow-visible">
          <div className="flex min-w-max gap-3 md:min-w-0 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-7">
            {items.map((item) => (
              <Link
                className="group block w-[173px] shrink-0 md:w-auto"
                data-tina-field={item.tinaField}
                href={item.href}
                key={item.href}
                onClick={(event) => {
                  if (edit) {
                    event.preventDefault();
                  }
                }}
              >
                <div className="aspect-square w-full overflow-hidden bg-[#f0f0f0]">
                  {item.image ? (
                    <div className="relative h-full w-full">
                      <FillImage
                        alt={item.name}
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 173px"
                        src={item.image}
                        variant={relatedImageVariant}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex w-full items-start justify-between gap-2 md:block">
                  <p className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:mt-3 md:text-[18px] md:leading-[1.5]">
                    {item.name}
                  </p>
                  <img alt="" aria-hidden className="mt-[1px] h-4 w-4 shrink-0 md:hidden" src="/library/header/nav-chevron-right.svg" />
                </div>
                {item.code ? <p className="mt-1 text-[16px] leading-none text-[var(--cp-primary-300)]">{formatProductCode(item.code)}</p> : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
