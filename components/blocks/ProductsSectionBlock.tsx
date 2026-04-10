"use client";

import { tinaField } from "tinacms/dist/react";
import PreviewCard from "@/components/home/PreviewCard";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function ProductsSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const imageOptions = resolveHomepageSectionImageOptions(record);
  const products = asBlockArray(block.products)
    .map((item) => ({
      raw: item as Record<string, unknown>,
      name: asText(item.name),
      link: asText(item.link),
      image: asText(item.image) || undefined,
    }))
    .filter((item) => item.name.length > 0)
    .slice(0, 4);

  return (
    <section className="cp-container px-[15px] pb-6 pt-12 md:px-[31px] md:pb-6 md:pt-16" data-tina-field={tinaField(record)}>
      <h2
        className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
        data-tina-field={tinaField(record, "title")}
      >
        {asText(block.title, "Products")}
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-4 md:grid-cols-4 md:gap-x-7 md:gap-y-0">
        {products.map((item, index) => (
          <PreviewCard
            href={item.link || "#"}
            image={item.image}
            imageClassName="h-[173px] md:h-[440px]"
            imageVariant={imageOptions.useOriginal ? null : imageOptions.variant}
            key={`${item.name}-${index}`}
            showMobileChevron
            tinaCardField={tinaField(item.raw)}
            tinaImageField={tinaField(item.raw, "image")}
            tinaTitleField={tinaField(item.raw, "name")}
            title={item.name}
            titleClassName="mt-3 text-[24px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)]"
          />
        ))}
      </div>
    </section>
  );
}
