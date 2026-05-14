"use client";

import Link from "next/link";
import { useState } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import ProductTechnicalDetailsTable from "@/components/special/catalog-product/ProductTechnicalDetailsTable";
import Button from "@/components/ui/Button";
import ArrowNavButton from "@/components/ui/ArrowNavButton";
import { formatProductCode } from "./helpers";
import CabinetImageGallery from "./CabinetImageGallery";
import type { ProductTechnicalDetailViewModel } from "@/components/special/catalog-product/types";
import type {
  CabinetData,
  CabinetGalleryItem,
  CabinetListItem,
  CabinetPageTextConfig,
  CabinetTechnicalDetail,
} from "./types";

interface CabinetProductInfoSectionProps {
  cabinet: CabinetData;
  pageText: CabinetPageTextConfig;
  block?: Record<string, unknown> | null;
  previousProduct?: CabinetListItem;
  nextProduct?: CabinetListItem;
  galleryItems: CabinetGalleryItem[];
  technicalDetails: CabinetTechnicalDetail[];
}

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

function normalizeDetailKey(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasDetailKey(details: ProductTechnicalDetailViewModel[], keys: string[]): boolean {
  const normalizedKeys = new Set(keys.map(normalizeDetailKey));
  return details.some((detail) => normalizedKeys.has(normalizeDetailKey(detail.key)));
}

function readTrimmed(value: string | null | undefined): string {
  return value?.trim() || "";
}

function titleCaseWords(value: string): string {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export default function CabinetProductInfoSection({
  cabinet,
  pageText,
  block,
  previousProduct,
  nextProduct,
  galleryItems,
  technicalDetails,
}: CabinetProductInfoSectionProps) {
  const { edit } = useEditState();
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const cabinetRecord = cabinet as unknown as Record<string, unknown>;
  const cabinetFieldName = tinaField(cabinetRecord) || undefined;
  const displayName = cabinet.name?.trim() || "Cabinet Door";
  const description = cabinet.description?.trim() || "";
  const code = formatProductCode(cabinet.code);

  const galleryThumbImageSize = readStringField(block, "galleryThumbImageSize");
  const galleryMainImageSize = readStringField(block, "galleryMainImageSize");
  const galleryLightboxImageSize = readStringField(block, "galleryLightboxImageSize");

  const breadcrumbField = block ? tinaField(block, "breadcrumbLabel") || undefined : undefined;
  const technicalDetailsTitleField = block ? tinaField(block, "technicalDetailsTitle") || undefined : undefined;
  const technicalDetailRows: ProductTechnicalDetailViewModel[] = technicalDetails.map((detail) => ({
    key: detail.key,
    value: detail.value,
    keyTinaField: tinaField(detail as unknown as Record<string, unknown>, "key") || undefined,
    valueTinaField: tinaField(detail as unknown as Record<string, unknown>, "value") || undefined,
  }));
  const productDetailRows: ProductTechnicalDetailViewModel[] = [];
  const doorStyle = readTrimmed(cabinet.doorStyle);
  const paint = readTrimmed(cabinet.paint);
  const stainType = readTrimmed(cabinet.stainType);
  const paintStain = [paint, stainType].filter(Boolean).join(" / ");

  if (doorStyle && !hasDetailKey(technicalDetailRows, ["Door Style"])) {
    productDetailRows.push({
      key: "Door Style",
      value: titleCaseWords(doorStyle),
      valueTinaField: tinaField(cabinetRecord, "doorStyle") || undefined,
    });
  }

  if (paintStain && !hasDetailKey(technicalDetailRows, ["Paint/Stain", "Paint", "Stain", "Stain Type"])) {
    productDetailRows.push({
      key: "Paint/Stain",
      value: titleCaseWords(paintStain),
      valueTinaField: tinaField(cabinetRecord, paint ? "paint" : "stainType") || undefined,
    });
  }

  const displayedTechnicalDetails = [...productDetailRows, ...technicalDetailRows];

  return (
    <section className="bg-white" data-tina-field={edit ? undefined : cabinetFieldName}>
      <div className="cp-container px-4 pb-12 pt-[34px] md:px-8 md:pb-16 md:pt-7">
        <div className="flex items-start justify-between gap-4 md:items-center">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1 text-[16px] leading-[1.2] text-[var(--cp-primary-300)] md:text-[14px]"
          >
            <Link className="transition-colors hover:text-[var(--cp-primary-350)]" href="/cabinets/catalog">
              <span data-tina-field={breadcrumbField}>
                {pageText.breadcrumbLabel}
              </span>
            </Link>
            <span>/</span>
            <span data-tina-field={tinaField(cabinetRecord, "name") || undefined}>
              {displayName}
            </span>
          </nav>

          <div className="flex shrink-0 gap-2 md:gap-4">
            <ArrowNavButton ariaLabel="Previous product" direction="previous" href={previousProduct ? `/cabinets/${previousProduct.slug}` : undefined} size="detail" />
            <ArrowNavButton ariaLabel="Next product" direction="next" href={nextProduct ? `/cabinets/${nextProduct.slug}` : undefined} size="detail" />
          </div>
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[675px_minmax(0,674px)] lg:items-start lg:gap-7">
          <CabinetImageGallery
            cabinet={cabinet}
            focusRootFieldName={cabinetFieldName}
            items={galleryItems}
            lightboxImageSizeChoice={galleryLightboxImageSize}
            mainImageSizeChoice={galleryMainImageSize}
            thumbImageSizeChoice={galleryThumbImageSize}
          />

          <div>
            {code ? (
              <p
                className="text-[18px] uppercase leading-normal text-[var(--cp-primary-300)]"
                data-tina-field={tinaField(cabinetRecord, "code") || undefined}
              >
                {code}
              </p>
            ) : null}

            <h1
              className="mt-2 max-w-[361px] font-[var(--font-red-hat-display)] text-[28px] font-semibold uppercase leading-[1.15] text-[var(--cp-primary-500)] md:max-w-[457px] md:text-[32px]"
              data-tina-field={tinaField(cabinetRecord, "name") || undefined}
            >
              {displayName}
            </h1>

            <div className="mt-6 flex flex-col gap-8">
              <Button className="order-1 w-fit !min-h-12 !px-8 !text-[20px] md:order-2" href="/contact-us" size="small" variant="secondary">
                {pageText.contactButtonLabel}
              </Button>

              <div className="order-2 md:order-1">
                <h2
                  className="text-[16px] font-semibold leading-[1.4] text-[var(--cp-primary-500)]"
                  data-tina-field={technicalDetailsTitleField}
                >
                  {pageText.technicalDetailsTitle}
                </h2>
                <ProductTechnicalDetailsTable details={displayedTechnicalDetails} />
              </div>

              {description ? (
                <div className="order-3 max-w-[677px]">
                  <button
                    className="inline-flex items-center gap-2 text-[16px] font-semibold leading-[1.4] text-[var(--cp-primary-500)]"
                    onClick={() => setDescriptionOpen((open) => !open)}
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden
                      className={`h-6 w-6 transition-transform ${descriptionOpen ? "rotate-90" : ""}`}
                      src="/library/header/nav-chevron-right.svg"
                    />
                    <span>{pageText.descriptionLabel}</span>
                  </button>

                  {descriptionOpen ? (
                    <p
                      className="mt-4 whitespace-pre-line text-[16px] leading-[1.4] text-[var(--cp-primary-500)]"
                      data-tina-field={tinaField(cabinetRecord, "description") || undefined}
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
