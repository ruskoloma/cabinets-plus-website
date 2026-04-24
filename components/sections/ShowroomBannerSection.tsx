"use client";

import { tinaField } from "tinacms/dist/react";
import { text } from "@/app/figma-home.helpers";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";

interface ShowroomBannerSectionProps {
  block: Record<string, unknown>;
}

export default function ShowroomBannerSection({ block }: ShowroomBannerSectionProps) {
  const showroomImage = text(
    block.image,
    "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/showroom-banner.jpg",
  );
  const showroomImageOptions = resolveHomepageSectionImageOptions(block);
  const heading = text(block.heading, "Visit Our Showroom");
  const subtext = text(block.subtext);
  const ctaLabel = text(block.ctaLabel);
  const ctaLink = text(block.ctaLink, "/contact-us");

  return (
    <section className="relative h-[697px] overflow-hidden" data-tina-field={tinaField(block)}>
      <FillImage
        alt={heading}
        className="object-cover object-center"
        data-tina-field={tinaField(block, "image") || undefined}
        sizes="100vw"
        src={showroomImage}
        variant={showroomImageOptions.useOriginal ? undefined : (showroomImageOptions.variant ?? "full")}
      />
      <div className="absolute inset-0 bg-[rgba(38,38,35,0.4)] md:hidden" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(38,38,35,0.6)_0%,rgba(38,38,35,0.45)_50%,rgba(38,38,35,0)_100%)] md:block" />
      <div className="cp-container relative h-full px-4 md:px-8">
        <div className="absolute left-4 top-[247px] w-[345px] max-w-[calc(100%-32px)] md:left-8 md:top-[225px] md:w-auto md:max-w-[806px]">
          <h2
            className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px] md:font-normal"
            data-tina-field={tinaField(block, "heading") || undefined}
          >
            {heading}
          </h2>
          {subtext ? (
            <p
              className="mt-4 max-w-[314px] text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:max-w-[493px] md:text-[18px] md:font-normal"
              data-tina-field={tinaField(block, "subtext") || undefined}
            >
              {subtext}
            </p>
          ) : null}
          {ctaLabel ? (
            <div className="mt-6 md:mt-8">
              <Button
                className="!border-white !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white"
                dataTinaField={tinaField(block, "ctaLabel") || undefined}
                href={ctaLink}
                variant="outline"
              >
                {ctaLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
