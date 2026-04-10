"use client";

import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function WhyUsSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const imageOptions = resolveHomepageSectionImageOptions(record);
  const features = asBlockArray(block.features)
    .map((item) => ({
      raw: item as Record<string, unknown>,
      icon: asText(item.icon) || undefined,
      title: asText(item.title),
      description: asText(item.description),
      image: asText(item.image) || undefined,
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, 3);

  const resolveSectionVariant = () =>
    imageOptions.useOriginal ? undefined : (imageOptions.variant ?? "card");

  return (
    <section className="cp-container px-[15px] py-12 md:px-[31px] md:py-16" data-tina-field={tinaField(record)}>
      <h2
        className="text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
        data-tina-field={tinaField(record, "title")}
      >
        {asText(block.title)}
      </h2>

      {(asText(block.introText).length > 0 || asText(block.introText2).length > 0) ? (
        <div className="mt-8 grid gap-4 text-[20px] leading-[1.45] text-[var(--cp-primary-500)] md:mt-4 md:grid-cols-[559px_minmax(0,1fr)] md:gap-20 md:py-8 md:text-[24px]">
          {asText(block.introText).length > 0 ? (
            <p className="max-w-[22ch] md:max-w-none" data-tina-field={tinaField(record, "introText")}>
              {asText(block.introText)}
            </p>
          ) : null}
          {asText(block.introText2).length > 0 ? (
            <p className="max-w-[24ch] md:max-w-none" data-tina-field={tinaField(record, "introText2")}>
              {asText(block.introText2)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 md:mt-4 md:grid-cols-3 md:gap-5 lg:gap-7">
        {features.map((item, index) => (
          <article className="flex flex-col" data-tina-field={tinaField(item.raw)} key={`${item.title}-${index}`}>
            {item.image ? (
              <div
                className="relative h-[373px] overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] md:h-[455px]"
                data-tina-field={tinaField(item.raw, "image")}
              >
                <FillImage
                  alt={item.title}
                  className="object-cover"
                  sizes="(min-width: 768px) 31vw, 100vw"
                  src={item.image}
                  variant={resolveSectionVariant()}
                />
              </div>
            ) : null}
            <h3
              className="mt-3 text-[20px] font-semibold leading-[1.15] text-[var(--cp-primary-500)] md:text-[24px] md:leading-[1.25]"
              data-tina-field={tinaField(item.raw, "title")}
            >
              {item.title}
            </h3>
            {item.description ? (
              <p
                className="mt-2 text-base leading-[1.45] text-[var(--cp-primary-500)] md:text-[18px] md:leading-[1.5]"
                data-tina-field={tinaField(item.raw, "description")}
              >
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
