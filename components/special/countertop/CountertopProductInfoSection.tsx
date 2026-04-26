"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import ProductMediaGallery from "@/components/special/catalog-product/ProductMediaGallery";
import ProductTechnicalDetailsTable from "@/components/special/catalog-product/ProductTechnicalDetailsTable";
import ArrowNavButton from "@/components/ui/ArrowNavButton";
import Button from "@/components/ui/Button";
import { getTinaSidebarMediaItemId } from "@/lib/tina-media-focus";
import type {
  CabinetPageTextConfig,
  CountertopData,
  CountertopListItem,
  ProductGalleryItemViewModel,
  ProductTechnicalDetailViewModel,
} from "./types";

interface CountertopProductInfoSectionProps {
  countertop: CountertopData;
  pageText: CabinetPageTextConfig;
  block?: Record<string, unknown> | null;
  previousProduct?: CountertopListItem;
  nextProduct?: CountertopListItem;
  galleryItems: ProductGalleryItemViewModel[];
  technicalDetails: ProductTechnicalDetailViewModel[];
}

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

function formatProductCode(code?: string | null): string {
  if (!code?.trim()) return "";
  return `#${code.replace(/^#+/, "").trim()}`;
}

function getGalleryTinaField(countertop: CountertopData, item: ProductGalleryItemViewModel): string | undefined {
  if (item.kind === "image" && countertop.picture?.trim() === item.file) {
    return tinaField(countertop as unknown as Record<string, unknown>, "picture") || undefined;
  }

  const matchedMedia = (countertop.media || []).find((media) => media?.file?.trim() === item.file);
  if (!matchedMedia) return undefined;

  return tinaField(matchedMedia as unknown as Record<string, unknown>, "file") || undefined;
}

function getGalleryFocusMediaItemId(countertop: CountertopData, item: ProductGalleryItemViewModel): string | undefined {
  if (item.kind === "image" && countertop.picture?.trim() === item.file) {
    return undefined;
  }

  const matchedMedia = (countertop.media || []).find((media) => media?.file?.trim() === item.file);
  return matchedMedia ? getTinaSidebarMediaItemId(item.file) : undefined;
}

export default function CountertopProductInfoSection({
  countertop,
  pageText,
  block,
  previousProduct,
  nextProduct,
  galleryItems,
  technicalDetails,
}: CountertopProductInfoSectionProps) {
  const { edit } = useEditState();
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const countertopRecord = countertop as unknown as Record<string, unknown>;
  const countertopFieldName = tinaField(countertopRecord) || undefined;
  const displayName = countertop.name?.trim() || "Countertop";
  const description = countertop.description?.trim() || "";
  const code = formatProductCode(countertop.code);

  const galleryThumbImageSize = readStringField(block, "galleryThumbImageSize");
  const galleryMainImageSize = readStringField(block, "galleryMainImageSize");
  const galleryLightboxImageSize = readStringField(block, "galleryLightboxImageSize");

  const breadcrumbField = block ? tinaField(block, "breadcrumbLabel") || undefined : undefined;
  const technicalDetailsTitleField = block ? tinaField(block, "technicalDetailsTitle") || undefined : undefined;

  const galleryItemsWithFields = useMemo(
    () =>
      galleryItems.map((item) => ({
        ...item,
        focusMediaItemId: getGalleryFocusMediaItemId(countertop, item),
        tinaField: getGalleryTinaField(countertop, item),
      })),
    [countertop, galleryItems],
  );

  return (
    <section className="bg-white" data-tina-field={edit ? undefined : countertopFieldName}>
      <div className="cp-container px-4 pb-12 pt-[34px] md:px-8 md:pb-16 md:pt-7">
        <div className="flex items-start justify-between gap-4 md:items-center">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1 text-[16px] leading-[1.2] text-[var(--cp-primary-300)] md:text-[14px]"
          >
            <Link className="transition-colors hover:text-[var(--cp-primary-350)]" href="/countertops/catalog">
              <span data-tina-field={breadcrumbField}>
                {pageText.breadcrumbLabel}
              </span>
            </Link>
            <span>/</span>
            <span data-tina-field={tinaField(countertopRecord, "name") || undefined}>
              {displayName}
            </span>
          </nav>

          <div className="flex shrink-0 gap-2 md:gap-4">
            <ArrowNavButton ariaLabel="Previous product" direction="previous" href={previousProduct ? `/countertops/${previousProduct.slug}` : undefined} size="detail" />
            <ArrowNavButton ariaLabel="Next product" direction="next" href={nextProduct ? `/countertops/${nextProduct.slug}` : undefined} size="detail" />
          </div>
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[675px_minmax(0,674px)] lg:items-start lg:gap-7">
          <ProductMediaGallery
            focusRootFieldName={countertopFieldName}
            items={galleryItemsWithFields}
            lightboxImageSizeChoice={galleryLightboxImageSize}
            mainImageSizeChoice={galleryMainImageSize}
            productName={displayName}
            thumbImageSizeChoice={galleryThumbImageSize}
          />

          <div>
            {code ? (
              <p
                className="text-[18px] uppercase leading-normal text-[var(--cp-primary-300)]"
                data-tina-field={tinaField(countertopRecord, "code") || undefined}
              >
                {code}
              </p>
            ) : null}

            <h1
              className="mt-2 max-w-[361px] font-[var(--font-red-hat-display)] text-[28px] font-semibold uppercase leading-[1.15] text-[var(--cp-primary-500)] md:max-w-[457px] md:text-[32px]"
              data-tina-field={tinaField(countertopRecord, "name") || undefined}
            >
              {displayName}
            </h1>

            <div className="mt-6 flex flex-col gap-8">
              <Button className="order-1 !min-h-12 !px-8 !text-[20px] md:order-2 md:w-fit" href="/contact-us" size="small" variant="primary">
                {pageText.contactButtonLabel}
              </Button>

              <div className="order-2 md:order-1">
                <h2
                  className="text-[16px] font-semibold leading-[1.4] text-[var(--cp-primary-500)]"
                  data-tina-field={technicalDetailsTitleField}
                >
                  {pageText.technicalDetailsTitle}
                </h2>
                <ProductTechnicalDetailsTable details={technicalDetails} />
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
                      data-tina-field={tinaField(countertopRecord, "description") || undefined}
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
