"use client";

import { tinaField } from "tinacms/dist/react";
import PreviewCard from "@/components/home/PreviewCard";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function ServicesSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const imageOptions = resolveHomepageSectionImageOptions(record);
  const services = asBlockArray(block.services)
    .map((item) => ({
      raw: item as Record<string, unknown>,
      title: asText(item.title),
      description: asText(item.description),
      link: asText(item.link),
      image: asText(item.image) || undefined,
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, 2);

  return (
    <section className="cp-container px-[15px] pb-12 pt-6 md:px-[30px] md:pb-[64px] md:pt-16" data-tina-field={tinaField(record)}>
      <h2
        className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
        data-tina-field={tinaField(record, "title")}
      >
        {asText(block.title, "Services")}
      </h2>
      <div className="mt-8 grid gap-8 md:mt-4 md:grid-cols-2 md:gap-x-[30px] md:gap-y-4">
        {services.map((item, index) => (
          <PreviewCard
            description={item.description}
            descriptionClassName="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]"
            href={item.link || "#"}
            image={item.image}
            imageClassName="h-[214px] md:h-[399px]"
            imageVariant={imageOptions.useOriginal ? null : imageOptions.variant}
            key={`${item.title}-${index}`}
            showMobileChevron
            tinaCardField={tinaField(item.raw)}
            tinaDescriptionField={tinaField(item.raw, "description")}
            tinaImageField={tinaField(item.raw, "image")}
            tinaTitleField={tinaField(item.raw, "title")}
            title={item.title}
            titleClassName="mt-3 text-[20px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
          />
        ))}
      </div>
    </section>
  );
}
