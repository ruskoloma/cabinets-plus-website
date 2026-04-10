"use client";

import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import { asText, type BlockRecord } from "./block-types";

const FALLBACK_HERO_IMAGE =
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/hero.jpg";

export default function HeroBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const imageOptions = resolveHomepageSectionImageOptions(record);
  const heroImage = asText(block.backgroundImage, FALLBACK_HERO_IMAGE);
  const variant = imageOptions.useOriginal ? undefined : (imageOptions.variant ?? "full");

  return (
    <section className="h-[697px]" data-tina-field={tinaField(record)}>
      <div className="relative h-full">
        <div className="absolute inset-0 overflow-hidden">
          <FillImage
            alt="Kitchen renovation"
            className="object-cover"
            data-tina-field={tinaField(record, "backgroundImage")}
            priority
            sizes="100vw"
            src={heroImage}
            variant={variant}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(38,36,35,0.8)]" />
        </div>

        <div className="cp-container relative h-full px-4 md:px-8">
          <div className="absolute left-4 top-[295px] w-[345px] max-w-[calc(100%-32px)] md:left-8 md:top-auto md:w-auto md:max-w-[806px] md:bottom-8">
            <h1
              className="text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[56px]"
              data-tina-field={tinaField(record, "heading")}
            >
              {asText(block.heading)}
            </h1>
            <p
              className="mt-4 max-w-[560px] text-base font-medium leading-[1.5] text-white md:mt-6 md:text-[18px]"
              data-tina-field={tinaField(record, "subtext")}
            >
              {asText(block.subtext)}
            </p>
            {asText(block.ctaLabel) ? (
              <div className="mt-8">
                <Button dataTinaField={tinaField(record, "ctaLabel")} href={asText(block.ctaLink, "/contact-us")} variant="primary">
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
