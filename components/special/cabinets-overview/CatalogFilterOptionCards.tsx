"use client";

import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant, type ImageSizeChoice } from "@/lib/image-size-controls";
import type { CatalogVisualOption } from "./types";

function isCatalogFilterAsset(src?: string | null): boolean {
  return Boolean(src?.includes("/library/catalog/"));
}

function OverlayOptionState({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cp-brand-neutral-300)]">
          <img alt="" aria-hidden="true" className="h-5 w-5" src="/library/catalog/filter-card-selected-check.svg" />
        </span>
      </span>
    );
  }

  return (
    <span className="absolute inset-0 hidden items-center justify-center bg-black/30 opacity-0 transition-opacity md:flex md:group-hover:opacity-100">
      <span className="font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-white">Select</span>
    </span>
  );
}

export function DoorStyleOptionCard({
  imageSizeChoice,
  option,
  selected,
  onClick,
}: {
  imageSizeChoice?: ImageSizeChoice;
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  const record = option as unknown as Record<string, unknown>;
  const imageVariant = isCatalogFilterAsset(option.image) ? undefined : resolveConfiguredImageVariant(imageSizeChoice, "thumb");

  return (
    <button className="group flex w-full flex-col items-center gap-2" onClick={onClick} type="button">
      <span className="relative block aspect-square w-full max-w-[173px] overflow-hidden bg-[#f2f2f2]">
        {option.image ? (
          <FillImage
            alt={option.label}
            className="object-contain"
            data-tina-field={tinaField(record, "image")}
            sizes="(max-width: 392px) calc((100vw - 47px) / 2), 173px"
            src={option.image}
            variant={imageVariant}
          />
        ) : null}

        <OverlayOptionState selected={selected} />
      </span>
      <span
        className="w-full whitespace-nowrap text-center font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] max-[374px]:text-[14px]"
        data-tina-field={tinaField(record, "label")}
      >
        {option.label}
      </span>
    </button>
  );
}

export function FinishOptionCard({
  imageSizeChoice,
  option,
  selected,
  onClick,
}: {
  imageSizeChoice?: ImageSizeChoice;
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  const record = option as unknown as Record<string, unknown>;
  const swatchColor = option.swatchColor?.trim();
  const hasImage = Boolean(option.image);
  const imageVariant = isCatalogFilterAsset(option.image) ? undefined : resolveConfiguredImageVariant(imageSizeChoice, "thumb");
  const swatchStyle = !hasImage && swatchColor ? { backgroundColor: swatchColor } : undefined;
  const needsBorder = !hasImage && (!swatchColor || ["#ffffff", "#faf9f6"].includes(swatchColor.toLowerCase()));

  return (
    <button className="group flex w-full flex-col items-center gap-2" onClick={onClick} type="button">
      <span
        className={`relative block aspect-square w-full max-w-[112px] overflow-hidden bg-white ${needsBorder ? "border border-[var(--cp-primary-100)]" : ""}`}
        data-tina-field={hasImage ? tinaField(record, "image") : tinaField(record, "swatchColor")}
        style={swatchStyle}
      >
        {hasImage ? (
          <FillImage
            alt={option.label}
            className="object-contain"
            sizes="(max-width: 392px) calc((100vw - 62px) / 3), 112px"
            src={option.image || ""}
            variant={imageVariant}
          />
        ) : null}

        <OverlayOptionState selected={selected} />
      </span>
      <span
        className="w-full text-center font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]"
        data-tina-field={tinaField(record, "label")}
      >
        {option.label}
      </span>
    </button>
  );
}
