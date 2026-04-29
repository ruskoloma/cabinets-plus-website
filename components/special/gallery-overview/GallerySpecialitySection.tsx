"use client";

import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import type { GalleryCollectionItemData } from "./types";

interface GallerySpecialitySectionProps {
  block?: Record<string, unknown> | null;
  collections: GalleryCollectionItemData[];
  enabled?: boolean;
  imageSizeChoice?: string | null;
  title?: string | null;
}

export default function GallerySpecialitySection({
  block,
  collections,
  enabled = true,
  imageSizeChoice,
  title,
}: GallerySpecialitySectionProps) {
  if (!enabled) return null;
  if (!collections || collections.length === 0) return null;

  const headingText = (title || "").trim() || "Speciality";
  const imageVariant: ImageVariantPreset | undefined = resolveConfiguredImageVariant(imageSizeChoice, "card");
  const isScrollable = collections.length > 3;

  return (
    <section className="mt-10 md:mt-12">
      <h2
        className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]"
        data-tina-field={block ? tinaField(block, "specialityTitle") || undefined : undefined}
      >
        {headingText}
      </h2>

      {/* Mobile: full-width cards stacked. Desktop: 3 in a row, horizontal scroll if 4+. */}
      <div className="mt-6 md:mt-8 md:hidden">
        <div className="flex flex-col gap-4">
          {collections.map((item) => (
            <SpecialityCard
              imageVariant={imageVariant}
              item={item}
              key={item.collectionSlug}
              orientation="mobile"
            />
          ))}
        </div>
      </div>

      <div className="mt-6 md:mt-8 hidden md:block">
        <div className={isScrollable ? "cp-hide-scrollbar overflow-x-auto pb-2" : ""}>
          <div
            className={
              isScrollable
                ? "flex min-w-max gap-7"
                : "grid grid-cols-3 gap-7"
            }
          >
            {collections.map((item) => (
              <SpecialityCard
                imageVariant={imageVariant}
                item={item}
                key={item.collectionSlug}
                orientation="desktop"
                fixedWidth={isScrollable}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecialityCard({
  fixedWidth,
  imageVariant,
  item,
  orientation,
}: {
  fixedWidth?: boolean;
  imageVariant?: ImageVariantPreset;
  item: GalleryCollectionItemData;
  orientation: "mobile" | "desktop";
}) {
  const isMobile = orientation === "mobile";
  const containerClass = isMobile
    ? "group relative block h-[100px] w-full overflow-hidden bg-[var(--cp-primary-100)]"
    : `group relative block h-[200px] overflow-hidden bg-[var(--cp-primary-100)] ${fixedWidth ? "w-[440px] shrink-0" : "w-full"}`;
  const titleClass = isMobile
    ? "absolute inset-0 flex items-center justify-center px-4 text-center text-[24px] uppercase font-semibold leading-[1.2] tracking-[0.03em] text-white font-[family-name:var(--font-red-hat-display)]"
    : "absolute bottom-4 left-4 right-12 text-[28px] uppercase font-semibold leading-[1] tracking-[0.03em] text-white font-[family-name:var(--font-red-hat-display)]";

  // Pass the linked Collection's `title` field to Tina so clicking the card in
  // edit mode opens the collection document in the sidebar — mirrors how the
  // GalleryProjectCard wires `data-tina-field={tinaField(project.rawProject, "title")}`.
  const tinaFieldValue = tinaField(item.rawCollection, "title") || undefined;

  return (
    <Link className={containerClass} data-tina-field={tinaFieldValue} href={`/collections/${item.collectionSlug}`}>
      <FillImage
        alt={item.collectionTitle}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        sizes={isMobile ? "(min-width: 768px) 33vw, 100vw" : "33vw"}
        src={item.coverImage}
        variant={imageVariant}
      />
      <span className="absolute inset-0 bg-black/35" />
      <span className={titleClass}>{item.collectionTitle}</span>
      <img
        alt=""
        aria-hidden
        className="absolute right-4 top-4 h-6 w-6"
        src="/library/icons/collection-card-arrow.svg"
      />
    </Link>
  );
}
