"use client";

import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import { asText, type BlockRecord } from "./block-types";

export default function ShowroomBannerBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const imageOptions = resolveHomepageSectionImageOptions(record);
  const image = asText(block.image, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/showroom-banner.jpg");
  const variant = imageOptions.useOriginal ? undefined : (imageOptions.variant ?? "full");

  return (
    <section className="h-[697px]" data-tina-field={tinaField(record)}>
      <div className="relative h-full">
        <div className="absolute inset-0 overflow-hidden">
          <FillImage
            alt="Showroom"
            className="object-cover object-center"
            data-tina-field={tinaField(record, "image")}
            sizes="100vw"
            src={image}
            variant={variant}
          />
          <div className="pointer-events-none absolute inset-0 bg-[rgba(38,38,35,0.4)] md:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(38,38,35,0.6)_0%,rgba(38,38,35,0.45)_50%,rgba(38,38,35,0)_100%)] md:block" />
        </div>

        <div className="cp-container relative h-full px-4 md:px-8">
          <div className="absolute left-8 top-[208px] w-[314px] md:left-[136px] md:top-[150px] md:w-[549px]">
            <h2
              className="font-[var(--font-red-hat-display)] text-[32px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px] md:font-normal"
              data-tina-field={tinaField(record, "heading")}
            >
              {asText(block.heading)}
            </h2>
            <p
              className="mt-4 text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:text-[24px] md:font-normal"
              data-tina-field={tinaField(record, "subtext")}
            >
              {asText(block.subtext)}
            </p>
            {asText(block.ctaLabel) ? (
              <div className="mt-6 md:mt-8">
                <Button
                  className="!bg-transparent !border-white !text-white hover:!border-white hover:!bg-white/10 hover:!text-white"
                  dataTinaField={tinaField(record, "ctaLabel")}
                  href={asText(block.ctaLink, "/contact-us")}
                  variant="outline"
                >
                  {asText(block.ctaLabel)}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
