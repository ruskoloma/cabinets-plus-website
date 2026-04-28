"use client";

import FillImage from "@/components/ui/FillImage";
import type { ImageVariantPreset } from "@/lib/image-variants";

export interface BreadcrumbItem {
  label: string;
  tinaFieldValue?: string;
}

interface PostPageHeroProps {
  breadcrumbItems: BreadcrumbItem[];
  imageVariant?: ImageVariantPreset;
  rootTinaFieldValue?: string;
  subtitle?: string;
  subtitleTinaFieldValue?: string;
  thumbnail?: string;
  thumbnailTinaFieldValue?: string;
  title: string;
  titleTinaFieldValue?: string;
}

export default function PostPageHero({
  breadcrumbItems,
  imageVariant,
  rootTinaFieldValue,
  subtitle,
  subtitleTinaFieldValue,
  thumbnail,
  thumbnailTinaFieldValue,
  title,
  titleTinaFieldValue,
}: PostPageHeroProps) {
  return (
    <section
      className="relative h-[697px] overflow-hidden bg-[var(--cp-brand-neutral-800)]"
      data-tina-field={rootTinaFieldValue}
    >
      {thumbnail ? (
        <div className="absolute inset-0" data-tina-field={thumbnailTinaFieldValue}>
          <FillImage
            alt={title}
            className="object-cover"
            sizes="100vw"
            src={thumbnail}
            variant={imageVariant}
          />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(38,36,35,0)_0%,rgba(38,36,35,0.6)_94.189%)]" />

      <div className="cp-container relative flex h-full items-end px-4 pb-8 md:px-8 md:pb-[79px]">
        <div className="max-w-full text-white md:max-w-[987px]">
          {breadcrumbItems.length ? (
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-[14px] leading-[1.2] text-white"
            >
              {breadcrumbItems.map((item, index) => (
                <span className="flex items-center gap-1" key={`${item.label}-${index}`}>
                  {index > 0 ? <span aria-hidden>/</span> : null}
                  <span data-tina-field={item.tinaFieldValue}>{item.label}</span>
                </span>
              ))}
            </nav>
          ) : null}

          <h1
            className="mt-[33px] font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
            data-tina-field={titleTinaFieldValue}
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              className="mt-4 max-w-[712px] font-[var(--font-red-hat-display)] text-[16px] font-medium leading-[1.5] text-white md:mt-7 md:text-[18px]"
              data-tina-field={subtitleTinaFieldValue}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
