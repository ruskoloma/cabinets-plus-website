"use client";

import Link from "next/link";
import { useState } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import ArrowNavButton from "@/components/ui/ArrowNavButton";
import { formatProductCode } from "./helpers";
import CabinetImageGallery from "./CabinetImageGallery";
import CabinetProjectStrip from "./CabinetProjectStrip";
import CabinetRelatedProducts from "./CabinetRelatedProducts";
import CabinetTechnicalDetailsTable from "./CabinetTechnicalDetailsTable";
import ContactUsSection from "@/components/home/ContactUsSection";
import type {
  CabinetData,
  CabinetGalleryItem,
  CabinetListItem,
  CabinetPageTextConfig,
  CabinetProjectItem,
  CabinetRelatedItem,
  CabinetTechnicalDetail,
} from "./types";

interface CabinetDoorPageProps {
  cabinet: CabinetData;
  currentSlug: string;
  previousProduct?: CabinetListItem;
  nextProduct?: CabinetListItem;
  galleryItems: CabinetGalleryItem[];
  technicalDetails: CabinetTechnicalDetail[];
  projectItems: CabinetProjectItem[];
  relatedItems: CabinetRelatedItem[];
  pageText: CabinetPageTextConfig;
  contactBlock?: Record<string, unknown> | null;
  pageSettingsRecord?: Record<string, unknown> | null;
  galleryThumbImageSize?: string | null;
  galleryMainImageSize?: string | null;
  galleryLightboxImageSize?: string | null;
  projectsSectionImageSize?: string | null;
  relatedProductsImageSize?: string | null;
}

export default function CabinetDoorPage({
  cabinet,
  currentSlug,
  previousProduct,
  nextProduct,
  galleryItems,
  technicalDetails,
  projectItems,
  relatedItems,
  pageText,
  contactBlock,
  pageSettingsRecord,
  galleryThumbImageSize,
  galleryMainImageSize,
  galleryLightboxImageSize,
  projectsSectionImageSize,
  relatedProductsImageSize,
}: CabinetDoorPageProps) {
  const { edit } = useEditState();
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const cabinetRecord = cabinet as unknown as Record<string, unknown>;
  const cabinetFieldName = tinaField(cabinetRecord) || undefined;
  const displayName = cabinet.name?.trim() || "Cabinet Door";
  const description = cabinet.description?.trim() || "";
  const code = formatProductCode(cabinet.code);

  return (
    <div className="bg-white">
      <section className="bg-white" data-tina-field={edit ? undefined : cabinetFieldName}>
        <div className="cp-container px-4 pb-12 pt-[34px] md:px-8 md:pb-16 md:pt-7">
          <div className="flex items-start justify-between gap-4 md:items-center">
            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-[16px] leading-[1.2] text-[var(--cp-primary-300)] md:text-[14px]">
              <Link className="transition-colors hover:text-[var(--cp-primary-350)]" href="/cabinets">
                <span data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "breadcrumbLabel") || undefined : undefined}>
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
                <Button className="order-1 !min-h-12 !px-8 !text-[20px] md:order-2 md:w-fit" href="/contact-us" size="small" variant="primary">
                  {pageText.contactButtonLabel}
                </Button>

                <div className="order-2 md:order-1">
                  <h2
                    className="text-[16px] font-semibold leading-[1.4] text-[var(--cp-primary-500)]"
                    data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "technicalDetailsTitle") || undefined : undefined}
                  >
                    {pageText.technicalDetailsTitle}
                  </h2>
                  <CabinetTechnicalDetailsTable details={technicalDetails} />
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

      <CabinetProjectStrip
        description={pageText.projectsSectionDescription}
        descriptionTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectsSectionDescription") || undefined : undefined}
        imageSizeChoice={projectsSectionImageSize}
        items={projectItems}
        sectionTinaField={cabinetFieldName}
        selectionListTinaField={tinaField(cabinetRecord, "relatedProjects") || undefined}
        selectionSourceRecord={cabinetRecord}
        title={pageText.projectsSectionTitle}
        titleTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectsSectionTitle") || undefined : undefined}
      />
      <CabinetRelatedProducts
        imageSizeChoice={relatedProductsImageSize}
        items={relatedItems}
        sectionTinaField={cabinetFieldName}
        title={pageText.relatedProductsTitle}
        titleTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "relatedProductsTitle") || undefined : undefined}
      />
      {contactBlock ? <ContactUsSection block={contactBlock} /> : null}

      <div className="sr-only" data-current-cabinet={currentSlug} />
    </div>
  );
}
