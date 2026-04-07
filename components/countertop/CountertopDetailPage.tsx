"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import ProductMediaGallery from "@/components/catalog-product/ProductMediaGallery";
import ProductProjectStrip from "@/components/catalog-product/ProductProjectStrip";
import ProductTechnicalDetailsTable from "@/components/catalog-product/ProductTechnicalDetailsTable";
import ContactUsSection from "@/components/home/ContactUsSection";
import ArrowNavButton from "@/components/ui/ArrowNavButton";
import Button from "@/components/ui/Button";
import {
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import { getTinaSidebarMediaItemId } from "@/lib/tina-media-focus";
import CountertopRelatedProducts from "./CountertopRelatedProducts";
import type { CountertopData, CountertopDetailPageProps, ProductGalleryItemViewModel } from "./types";

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

export default function CountertopDetailPage({
  countertop,
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
}: CountertopDetailPageProps) {
  const { edit } = useEditState();
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const countertopRecord = countertop as unknown as Record<string, unknown>;
  const displayName = countertop.name?.trim() || "Countertop";
  const description = countertop.description?.trim() || "";
  const code = formatProductCode(countertop.code);

  const galleryItemsWithFields = useMemo(
    () =>
      galleryItems.map((item) => ({
        ...item,
        focusMediaItemId: getGalleryFocusMediaItemId(countertop, item),
        tinaField: getGalleryTinaField(countertop, item),
      })),
    [countertop, galleryItems],
  );
  const countertopFieldName = tinaField(countertopRecord) || undefined;

  return (
    <div className="bg-white">
      <section className="bg-white" data-tina-field={edit ? undefined : countertopFieldName}>
        <div className="cp-container px-4 pb-12 pt-[34px] md:px-8 md:pb-16 md:pt-7">
          <div className="flex items-start justify-between gap-4 md:items-center">
            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-[16px] leading-[1.2] text-[var(--cp-primary-300)] md:text-[14px]">
              <Link className="transition-colors hover:text-[var(--cp-primary-350)]" href="/countertops">
                <span data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "breadcrumbLabel") || undefined : undefined}>
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
                    data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "technicalDetailsTitle") || undefined : undefined}
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

      <ProductProjectStrip
        description={pageText.projectsSectionDescription}
        descriptionTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectsSectionDescription") || undefined : undefined}
        imageSizeChoice={projectsSectionImageSize}
        items={projectItems.map((project) => ({
          file: project.file,
          title: project.title,
          href: project.href,
          focusItemId: project.projectSource ? getProjectReferenceFocusItemId(project.projectSource) : undefined,
          selectionTinaField:
            typeof project.selectionIndex === "number"
              ? tinaField(countertopRecord, `relatedProjects.${project.selectionIndex}.project`) || undefined
              : tinaField(countertopRecord, "relatedProjects") || undefined,
          imageTinaField: project.mediaSource
            ? tinaField(project.mediaSource, "file") || undefined
            : project.media
              ? tinaField(project.media as unknown as Record<string, unknown>, "file") || undefined
            : project.project
              ? tinaField(project.project as unknown as Record<string, unknown>, "primaryPicture") || undefined
              : undefined,
          titleTinaField: project.projectSource
            ? tinaField(project.projectSource, "title") || undefined
            : project.media
              ? tinaField(project.media as unknown as Record<string, unknown>, "label") || tinaField(project.media as unknown as Record<string, unknown>, "altText") || undefined
            : project.project
              ? tinaField(project.project as unknown as Record<string, unknown>, "title") || undefined
              : undefined,
        }))}
        focusListKey={TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS}
        focusRootFieldName={countertopFieldName}
        sectionTinaField={countertopFieldName}
        title={pageText.projectsSectionTitle}
        titleTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectsSectionTitle") || undefined : undefined}
      />
      <CountertopRelatedProducts
        imageSizeChoice={relatedProductsImageSize}
        items={relatedItems}
        sectionTinaField={countertopFieldName}
        title={pageText.relatedProductsTitle}
        titleTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "relatedProductsTitle") || undefined : undefined}
      />
      {contactBlock ? <ContactUsSection block={contactBlock} /> : null}

      <div className="sr-only" data-current-countertop={currentSlug} />
    </div>
  );
}
