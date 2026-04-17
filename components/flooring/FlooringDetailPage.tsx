"use client";

import { tinaField } from "tinacms/dist/react";
import ContactUsSection from "@/components/home/ContactUsSection";
import ProductProjectStrip from "@/components/catalog-product/ProductProjectStrip";
import FAQSectionBlock from "@/components/blocks/FAQSectionBlock";
import PartnersSection from "@/components/shared/PartnersSection";
import TextImageSection from "@/components/shared/TextImageSection";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import { resolveTemplateName, text, toBlockArray, type HomeBlock } from "@/app/figma-home.helpers";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import {
  getProjectReferenceFocusItemId,
  TINA_LIST_KEY_FLOORING_RELATED_PROJECTS,
} from "@/lib/tina-list-focus";
import FlooringProductInfoSection from "./FlooringProductInfoSection";
import FlooringRelatedProducts from "./FlooringRelatedProducts";
import type { FlooringDetailPageProps } from "./types";

const FLOORING_PRODUCT_INFO_TEMPLATE = "flooringProductInfo";

function ensureProductInfoBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasProductInfo = blocks.some(
    (block) => resolveTemplateName(block) === FLOORING_PRODUCT_INFO_TEMPLATE,
  );

  if (hasProductInfo) return blocks;

  return [{ _template: FLOORING_PRODUCT_INFO_TEMPLATE } as HomeBlock, ...blocks];
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? value : fallback;
}

export default function FlooringDetailPage({
  flooring,
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
}: FlooringDetailPageProps) {
  const rawBlocks = toBlockArray(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensureProductInfoBlock(rawBlocks);

  return (
    <div className="bg-white">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const blockField = tinaField(blockRecord) || undefined;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case "flooringProductInfo":
            return (
              <div data-tina-field={blockField} key={key}>
                <FlooringProductInfoSection
                  block={blockRecord}
                  flooring={flooring}
                  galleryItems={galleryItems}
                  nextProduct={nextProduct}
                  pageText={pageText}
                  previousProduct={previousProduct}
                  technicalDetails={technicalDetails}
                />
              </div>
            );

          case "projectsUsingThisProduct": {
            const blockTitle = readString(blockRecord.title, pageText.projectsSectionTitle);
            const blockDescription = readString(blockRecord.description, pageText.projectsSectionDescription);
            const titleField = tinaField(blockRecord, "title") || undefined;
            const descriptionField = tinaField(blockRecord, "description") || undefined;
            const flooringRecord = flooring as unknown as Record<string, unknown>;
            const flooringFieldName = tinaField(flooringRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <ProductProjectStrip
                  description={blockDescription}
                  descriptionTinaField={descriptionField}
                  focusListKey={TINA_LIST_KEY_FLOORING_RELATED_PROJECTS}
                  focusRootFieldName={flooringFieldName}
                  imageSizeChoice={imageSizeChoice}
                  items={projectItems.map((project) => ({
                    file: project.file,
                    title: project.title,
                    href: project.href,
                    focusItemId: project.projectSource ? getProjectReferenceFocusItemId(project.projectSource) : undefined,
                    selectionTinaField:
                      typeof project.selectionIndex === "number"
                        ? tinaField(flooringRecord, `relatedProjects.${project.selectionIndex}.project`) || undefined
                        : tinaField(flooringRecord, "relatedProjects") || undefined,
                    imageTinaField: project.mediaSource
                      ? tinaField(project.mediaSource, "file") || undefined
                      : project.media
                        ? tinaField(project.media as unknown as Record<string, unknown>, "file") || undefined
                        : project.project
                          ? tinaField(project.project as unknown as Record<string, unknown>, "media.0.file") || undefined
                          : undefined,
                    titleTinaField: project.projectSource
                      ? tinaField(project.projectSource, "title") || undefined
                      : project.media
                        ? tinaField(project.media as unknown as Record<string, unknown>, "label") || tinaField(project.media as unknown as Record<string, unknown>, "altText") || undefined
                        : project.project
                          ? tinaField(project.project as unknown as Record<string, unknown>, "title") || undefined
                          : undefined,
                  }))}
                  sectionTinaField={flooringFieldName}
                  title={blockTitle}
                  titleTinaField={titleField}
                />
              </div>
            );
          }

          case "relatedProducts": {
            const blockTitle = readString(blockRecord.title, pageText.relatedProductsTitle);
            const titleField = tinaField(blockRecord, "title") || undefined;
            const flooringRecord = flooring as unknown as Record<string, unknown>;
            const flooringFieldName = tinaField(flooringRecord) || undefined;
            const imageSizeChoice =
              typeof blockRecord.imageSize === "string" ? blockRecord.imageSize : null;

            return (
              <div data-tina-field={blockField} key={key}>
                <FlooringRelatedProducts
                  imageSizeChoice={imageSizeChoice}
                  items={relatedItems}
                  sectionTinaField={flooringFieldName}
                  title={blockTitle}
                  titleTinaField={titleField}
                />
              </div>
            );
          }

          case "contactSection":
            return (
              <div key={key}>
                <ContactUsSection block={blockRecord} />
              </div>
            );

          case "textImageSection":
            return (
              <div key={key}>
                <TextImageSection block={blockRecord} />
              </div>
            );

          case "faqSection":
            return (
              <div key={key}>
                <FAQSectionBlock block={blockRecord} />
              </div>
            );

          case "partnersSection":
            return (
              <div key={key}>
                <PartnersSection block={blockRecord} />
              </div>
            );

          case "showroomBanner": {
            const showroomImage = text(
              blockRecord.image,
              "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/showroom-banner.jpg",
            );
            const showroomImageOptions = resolveHomepageSectionImageOptions(blockRecord);
            const heading = text(blockRecord.heading, "Visit Our Showroom");
            const subtext = text(blockRecord.subtext);
            const ctaLabel = text(blockRecord.ctaLabel);
            const ctaLink = text(blockRecord.ctaLink, "/contact-us");

            return (
              <section
                className="relative h-[697px] overflow-hidden"
                data-tina-field={blockField}
                key={key}
              >
                <FillImage
                  alt={heading}
                  className="object-cover object-center"
                  data-tina-field={tinaField(blockRecord, "image") || undefined}
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
                      data-tina-field={tinaField(blockRecord, "heading") || undefined}
                    >
                      {heading}
                    </h2>
                    {subtext ? (
                      <p
                        className="mt-4 max-w-[314px] text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:max-w-[493px] md:text-[18px] md:font-normal"
                        data-tina-field={tinaField(blockRecord, "subtext") || undefined}
                      >
                        {subtext}
                      </p>
                    ) : null}
                    {ctaLabel ? (
                      <div className="mt-6 md:mt-8">
                        <Button
                          className="!border-white !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white"
                          dataTinaField={tinaField(blockRecord, "ctaLabel") || undefined}
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

          default:
            return null;
        }
      })}

      {contactBlock && !blocks.some((block) => resolveTemplateName(block) === "contactSection") ? (
        <ContactUsSection block={contactBlock} />
      ) : null}

      <div className="sr-only" data-current-flooring={currentSlug} />
    </div>
  );
}
