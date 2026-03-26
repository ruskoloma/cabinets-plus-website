"use client";

import Link from "next/link";
import { useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import type { ProductRelatedCardItem } from "./types";

interface ProductRelatedProductsProps {
  items: ProductRelatedCardItem[];
  title: string;
}

function formatProductCode(code?: string): string {
  if (!code?.trim()) return "";
  return `#${code.replace(/^#+/, "").trim()}`;
}

export default function ProductRelatedProducts({ items, title }: ProductRelatedProductsProps) {
  const { edit } = useEditState();
  if (!items.length) return null;

  return (
    <section className="bg-white">
      <div className="cp-container px-4 py-10 md:px-8 md:py-16">
        <h2 className="font-[var(--font-red-hat-display)] text-[28px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]">
          {title}
        </h2>

        <div className="cp-hide-scrollbar mt-6 overflow-x-auto pb-2 md:mt-10 md:overflow-visible">
          <div className="flex min-w-max gap-3 md:min-w-0 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-7">
            {items.map((item) => (
              <Link
                className="group block w-[215px] shrink-0 md:w-auto"
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
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 215px"
                        src={item.image}
                      />
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:mt-3">
                  {item.name}
                </p>
                {item.code ? <p className="text-[16px] leading-none text-[var(--cp-primary-300)]">{formatProductCode(item.code)}</p> : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
