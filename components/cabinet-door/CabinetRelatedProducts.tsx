"use client";

import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import { formatProductCode } from "./helpers";
import type { CabinetRelatedItem } from "./types";

interface CabinetRelatedProductsProps {
  items: CabinetRelatedItem[];
  title: string;
}

export default function CabinetRelatedProducts({ items, title }: CabinetRelatedProductsProps) {
  if (!items.length) return null;

  return (
    <section className="bg-white">
      <div className="cp-container px-4 py-14 md:px-8 md:py-16">
        <h2 className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)]">
          {title}
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:justify-center xl:gap-7">
          {items.map((item) => (
            <Link
              className="group block w-full xl:w-[279px] xl:shrink-0"
              data-tina-field={item.relation ? tinaField(item.relation as unknown as Record<string, unknown>, "product") : undefined}
              href={`/cabinets/${item.slug}`}
              key={item.slug}
            >
              <div className="aspect-square w-full overflow-hidden bg-[#f0f0f0]">
                {item.image ? (
                  <img alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" src={item.image} />
                ) : null}
              </div>
              <p className="mt-3 font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]">{item.name}</p>
              {item.code ? <p className="text-[16px] leading-none text-[var(--cp-primary-300)]">{formatProductCode(item.code)}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
