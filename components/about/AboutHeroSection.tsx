"use client";

import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";

interface AboutHeroSectionProps {
  block: Record<string, unknown>;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export default function AboutHeroSection({ block }: AboutHeroSectionProps) {
  const image = text(block.backgroundImage, "/library/about/about-hero-cropped.jpeg");

  return (
    <section className="relative h-[697px] overflow-hidden bg-[var(--cp-primary-100)]" data-tina-field={tinaField(block)}>
      <FillImage
        alt="Cabinets Plus team"
        className="object-cover object-[center_58%]"
        data-tina-field={tinaField(block, "backgroundImage")}
        priority
        sizes="100vw"
        src={image}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(38,36,35,0.4)]" />

      <div className="cp-container relative h-full px-4 md:px-8">
        <div className="absolute left-4 top-[269px] w-[345px] md:left-8 md:bottom-9 md:top-auto md:w-[987px]">
          <h1
            className="text-[40px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]"
            data-tina-field={tinaField(block, "heading")}
          >
            {text(block.heading, "Spokane's Leading Experts in Cabinets, Countertops & Flooring")}
          </h1>
          <p
            className="mt-4 max-w-[314px] text-base font-medium leading-[1.5] text-white md:mt-7 md:max-w-[712px] md:text-[18px]"
            data-tina-field={tinaField(block, "subtext")}
          >
            {text(
              block.subtext,
              "We're dedicated to helping you design and achieve the space of your dreams. Visit our showroom today and our team can guide you through the process.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
