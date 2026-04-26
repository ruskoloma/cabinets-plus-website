"use client";

import { tinaField } from "tinacms/dist/react";
import {
  FALLBACK_HERO_IMAGE,
  FALLBACK_PROCESS_ICONS,
  getBlock,
  mapFaqTabs,
  mapProducts,
  mapResolvedProjects,
  mapSteps,
  resolveTemplateName,
  text,
  toBlockArray,
  type Dict,
} from "@/app/figma-home.helpers";
import ContactUsSection from "@/components/shared/ContactUsSection";
import OurShowroomSection from "@/components/shared/OurShowroomSection";
import Button from "@/components/ui/Button";
import FallbackImg from "@/components/ui/FallbackImg";
import PreviewCard from "@/components/home/PreviewCard";
import ProjectMosaic from "@/components/home/ProjectMosaic";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import { CountertopPartnersSection } from "@/components/shared/OurPartnersSection";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import TextImageSection from "@/components/sections/TextImageSection";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";
import FillImage from "@/components/ui/FillImage";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";

interface Props {
  page: Dict;
}

const FALLBACK_MATERIAL_IMAGES = [
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/product-countertops.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/feature-1.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/feature-2.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/feature-3.jpg",
];

export default function FigmaCountertopsOverviewPage({ page }: Props) {
  const parsedBlocks = useResolvedSharedSectionBlocks(page.blocks);

  const hero = getBlock(parsedBlocks, "hero");
  const materials = getBlock(parsedBlocks, "productsSection");
  const projects = getBlock(parsedBlocks, "projectsSection");
  const dedicatedPartners = getBlock(parsedBlocks, "countertopPartnersSection");
  const genericPartners = getBlock(parsedBlocks, "partnersSection");
  const process = getBlock(parsedBlocks, "processSection");
  const showroomBanner = getBlock(parsedBlocks, "showroomBanner");
  const faq = getBlock(parsedBlocks, "faqSection");
  const contact = getBlock(parsedBlocks, "contactSection");
  const showroomSection = getBlock(parsedBlocks, "showroomSection");

  const heroRecord = hero as Record<string, unknown>;
  const materialsRecord = materials as Record<string, unknown>;
  const projectsRecord = projects as Record<string, unknown>;
  const processRecord = process as Record<string, unknown>;
  const showroomRecord = showroomBanner as Record<string, unknown>;
  const faqRecord = faq as Record<string, unknown>;
  const contactRecord = contact as Record<string, unknown>;
  const showroomSectionRecord = showroomSection as Record<string, unknown>;
  const partnersRecord = (
    Object.keys(dedicatedPartners).length > 0 ? dedicatedPartners : genericPartners
  ) as Record<string, unknown>;

  const heroImageOptions = resolveHomepageSectionImageOptions(heroRecord);
  const materialsImageOptions = resolveHomepageSectionImageOptions(materialsRecord);
  const projectsImageOptions = resolveHomepageSectionImageOptions(projectsRecord);
  const showroomImageOptions = resolveHomepageSectionImageOptions(showroomRecord);
  const contactImageOptions = resolveHomepageSectionImageOptions(contactRecord);

  const materialItems = mapProducts(toBlockArray(materials.products)).slice(0, 4);
  const processItems = mapSteps(toBlockArray(process.steps));
  const faqTabs = mapFaqTabs(toBlockArray(faq.tabs));

  const heroImage = text(hero.backgroundImage, FALLBACK_HERO_IMAGE);
  const projectMosaicItems = mapResolvedProjects(projects.projects ?? projects.resolvedProjects).slice(0, 5).map((item, index) => ({
    image: item.image,
    title: item.title,
    href: item.href,
    tinaField: tinaField(projectsRecord, `projects.${index}`),
  }));
  const showroomImage = text(
    showroomBanner.image,
    "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/showroom-banner.jpg",
  );

  const templateOrder = parsedBlocks.reduce<Record<string, number>>((acc, block, index) => {
    const template = resolveTemplateName(block);
    if (template && acc[template] === undefined) {
      acc[template] = index;
    }
    return acc;
  }, {});

  const hasTemplate = (template: string) => templateOrder[template] !== undefined;
  const getSectionOrder = (template: string, fallbackOrder: number, offset = 0) =>
    ((templateOrder[template] ?? fallbackOrder) * 10) + offset;
  const hasPartnersTemplate = hasTemplate("countertopPartnersSection") || hasTemplate("partnersSection");
  const partnersTemplate = hasTemplate("countertopPartnersSection") ? "countertopPartnersSection" : "partnersSection";
  const customTemplates = new Set([
    "hero",
    "productsSection",
    "projectsSection",
    "textImageSection",
    "partnersSection",
    "countertopPartnersSection",
    "processSection",
    "showroomBanner",
    "faqSection",
    "contactSection",
    "showroomSection",
  ]);

  const resolveSectionVariant = (
    options: { useOriginal?: boolean; variant?: ImageVariantPreset },
    defaultVariant: ImageVariantPreset,
  ) => (options.useOriginal ? undefined : (options.variant ?? defaultVariant));

  const processDesktopLineSegments = [
    { left: "22px", top: "65px", height: "80px" },
    { left: "22px", top: "205px", height: "80px" },
    { left: "22px", top: "345px", height: "80px" },
    { left: "22px", top: "485px", height: "80px" },
  ];
  const processMobileLineSegments = [
    { left: "18px", top: "60px", height: "120px" },
    { left: "18px", top: "245px", height: "165px" },
    { left: "18px", top: "475px", height: "140px" },
    { left: "18px", top: "680px", height: "125px" },
  ];

  return (
    <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">
      {hasTemplate("hero") ? (
        <section
          className="relative min-h-[697px] overflow-hidden"
          data-tina-field={tinaField(heroRecord)}
          style={{ order: getSectionOrder("hero", 0) }}
        >
          <FillImage
            alt="Countertops hero"
            className="object-cover"
            data-tina-field={tinaField(heroRecord, "backgroundImage")}
            priority
            sizes="100vw"
            src={heroImage}
            variant={resolveSectionVariant(heroImageOptions, "full")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(38,36,35,0.8)]" />

          <div className="cp-container relative flex min-h-[697px] flex-col px-4 pb-8 pt-[247px] md:px-8 md:pb-8 md:pt-16">
            <div className="md:mt-auto md:max-w-[806px]">
              <h1
                className="text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[56px]"
                data-tina-field={tinaField(heroRecord, "heading")}
              >
                {text(hero.heading, "Top-Quality Countertops in Spokane at Great Prices")}
              </h1>
              <p
                className="mt-4 text-base font-medium leading-[1.5] text-white md:mt-6 md:max-w-[712px] md:text-[18px]"
                data-tina-field={tinaField(heroRecord, "subtext")}
              >
                {text(
                  hero.subtext,
                  "Upgrade your kitchen or bathroom with durable, stylish quartz and granite countertops. Visit our Spokane showroom to explore your options, get expert guidance, and enjoy professional installation at competitive prices.",
                )}
              </p>
              <div className="mt-6 md:mt-8">
                <Button
                  dataTinaField={tinaField(heroRecord, "ctaLabel")}
                  href={text(hero.ctaLink, "/countertops/catalog")}
                  variant="primary"
                >
                  {text(hero.ctaLabel, "View Catalog")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {hasTemplate("productsSection") ? (
        <section
          className="cp-container px-[15px] pb-6 pt-12 md:px-[31px] md:pb-[64px] md:pt-16"
          data-tina-field={tinaField(materialsRecord)}
          id="materials"
          style={{ order: getSectionOrder("productsSection", 1) }}
        >
          <h2
            className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
            data-tina-field={tinaField(materialsRecord, "title")}
          >
            {text(materials.title, "Countertop Materials")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-8 md:grid-cols-4 md:gap-x-7 md:gap-y-0">
            {materialItems.map((item, index) => (
              <PreviewCard
                href={item.link || "#"}
                image={item.image || FALLBACK_MATERIAL_IMAGES[index]}
                imageClassName="h-[173px] md:h-[324px]"
                imageVariant={materialsImageOptions.useOriginal ? null : materialsImageOptions.variant}
                key={`${item.name}-${index}`}
                tinaCardField={tinaField(item.raw as Record<string, unknown>)}
                tinaImageField={tinaField(item.raw as Record<string, unknown>, "image")}
                tinaTitleField={tinaField(item.raw as Record<string, unknown>, "name")}
                title={item.name}
                titleClassName="mt-3 text-[18px] font-normal capitalize leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
              />
            ))}
          </div>
          <div className="mt-10 text-center md:mt-12">
            <Button
              className="!min-h-12 md:!min-h-14"
              dataTinaField={tinaField(materialsRecord, "ctaLabel")}
              href={text(materials.ctaLink, "/countertops/catalog")}
              variant="outline"
            >
              {text(materials.ctaLabel, "View Catalog")}
            </Button>
          </div>
        </section>
      ) : null}

      {hasTemplate("projectsSection") ? (
        <section
          className="bg-[var(--cp-brand-neutral-50)] px-0 py-12 md:py-16"
          data-tina-field={tinaField(projectsRecord)}
          id="projects"
          style={{ order: getSectionOrder("projectsSection", 2) }}
        >
          <div className="cp-container px-4 md:px-8">
            <h2
              className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
              data-tina-field={tinaField(projectsRecord, "title")}
            >
              {text(projects.title, "Featured projects")}
            </h2>
            <ProjectMosaic
              imageVariant={projectsImageOptions.useOriginal ? null : projectsImageOptions.variant}
              items={projectMosaicItems}
            />
            <div className="mt-12 text-center md:mt-7">
              <Button
                className="!min-h-12 md:!min-h-14"
                dataTinaField={tinaField(projectsRecord, "ctaLabel")}
                href={text(projects.ctaLink, "/gallery")}
                variant="outline"
              >
                {text(projects.ctaLabel, "View All projects")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {parsedBlocks.map((block, index) => {
        if (resolveTemplateName(block) !== "textImageSection") return null;
        const blockRecord = block as Record<string, unknown>;
        return (
          <div key={`text-image-${index}`} style={{ order: index * 10 }}>
            <TextImageSection block={blockRecord} />
          </div>
        );
      })}

      {hasPartnersTemplate ? (
        <div style={{ order: getSectionOrder(partnersTemplate, 3) }}>
          <CountertopPartnersSection block={partnersRecord} />
        </div>
      ) : null}

      {hasTemplate("processSection") ? (
        <section
          className="bg-white py-12 md:py-20"
          data-tina-field={tinaField(processRecord)}
          style={{ order: getSectionOrder("processSection", 4) }}
        >
          <div className="cp-container px-4 md:px-[130px]">
            <h2
              className="text-center text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
              data-tina-field={tinaField(processRecord, "title")}
            >
              {text(process.title, "Our Countertop Installation Process")}
            </h2>

            <div className="relative mx-auto mt-10 w-full max-w-[361px] md:mt-12 md:max-w-[1018px]">
              {processMobileLineSegments.slice(0, Math.max(0, processItems.length - 1)).map((segment, index) => (
                <span
                  className="absolute w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:hidden"
                  key={`cts-process-mobile-line-${index}`}
                  style={{ height: segment.height, left: segment.left, top: segment.top }}
                />
              ))}
              {processDesktopLineSegments.slice(0, Math.max(0, processItems.length - 1)).map((segment, index) => (
                <span
                  className="absolute hidden w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:block"
                  key={`cts-process-desktop-line-${index}`}
                  style={{ height: segment.height, left: segment.left, top: segment.top }}
                />
              ))}

              <div className="flex flex-col gap-10 md:gap-12">
                {processItems.map((item, index) => {
                  const iconSrc = item.iconImage || FALLBACK_PROCESS_ICONS[index] || FALLBACK_PROCESS_ICONS[0];
                  return (
                    <article
                      className="grid items-start grid-cols-[40px_1fr] gap-6 md:grid-cols-[48px_1fr]"
                      data-tina-field={tinaField(item.raw as Record<string, unknown>)}
                      key={`${item.title}-${index}`}
                    >
                      <div className="relative z-10 flex justify-center">
                        <div className="flex items-center justify-center bg-white h-10 w-10 md:h-12 md:w-12">
                          {iconSrc ? (
                            <FallbackImg
                              alt=""
                              aria-hidden
                              className="h-10 w-10 md:h-12 md:w-12 object-contain"
                              data-tina-field={tinaField(item.raw as Record<string, unknown>, "iconImage")}
                              src={iconSrc}
                              variant="thumb"
                            />
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <h3
                          className="font-[var(--font-red-hat-display)] text-[20px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
                          data-tina-field={tinaField(item.raw as Record<string, unknown>, "title")}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)] md:text-[16px]"
                          data-tina-field={tinaField(item.raw as Record<string, unknown>, "description")}
                        >
                          {item.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {hasTemplate("showroomBanner") ? (
        <section
          className="relative min-h-[697px] overflow-hidden"
          data-tina-field={tinaField(showroomRecord)}
          style={{ order: getSectionOrder("showroomBanner", 5) }}
        >
          <FillImage
            alt="Countertop slabs warehouse"
            className="object-cover object-center"
            data-tina-field={tinaField(showroomRecord, "image")}
            sizes="100vw"
            src={showroomImage}
            variant={resolveSectionVariant(showroomImageOptions, "full")}
          />
          <div className="absolute inset-0 bg-[rgba(38,38,35,0.4)] md:hidden" />
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(38,38,35,0.6)_0%,rgba(38,38,35,0.45)_50%,rgba(38,38,35,0)_100%)] md:block" />

          <div className="cp-container relative flex min-h-[697px] flex-col px-4 pb-8 pt-[247px] md:px-8 md:pb-8 md:pt-[225px]">
            <div className="md:max-w-[806px]">
              <h2
                className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px] md:font-normal"
                data-tina-field={tinaField(showroomRecord, "heading")}
              >
                {text(showroomBanner.heading, "Find Your Perfect Countertop")}
              </h2>
              <p
                className="mt-4 text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:max-w-[493px] md:text-[18px] md:font-normal"
                data-tina-field={tinaField(showroomRecord, "subtext")}
              >
                {text(
                  showroomBanner.subtext,
                  "With a huge selection of premium quartz and granite, sourced from trusted partners, Cabinets Plus brings you top-quality countertops to match any style and space.",
                )}
              </p>
              {text(showroomBanner.ctaLabel) ? (
                <div className="mt-6 md:mt-8">
                  <Button
                    className="!border-white !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white"
                    dataTinaField={tinaField(showroomRecord, "ctaLabel")}
                    href={text(showroomBanner.ctaLink, "/contact-us")}
                    variant="outline"
                  >
                    {text(showroomBanner.ctaLabel)}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasTemplate("faqSection") ? (
        <section
          className="bg-[#edebe5] py-8 md:py-16"
          data-tina-field={tinaField(faqRecord)}
          id="faq"
          style={{ order: getSectionOrder("faqSection", 6) }}
        >
          <div className="cp-container px-4 md:px-8">
            <h2
              className="text-center text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
              data-tina-field={tinaField(faqRecord, "title")}
            >
              {text(faq.title, "F.A.Q.")}
            </h2>
            <FaqTabsAccordion tabs={faqTabs} />
          </div>
        </section>
      ) : null}

      {hasTemplate("contactSection") ? (
        <div style={{ order: getSectionOrder("contactSection", 7, 0) }}>
          <ContactUsSection
            block={contactRecord}
            imageVariant={contactImageOptions.useOriginal ? null : contactImageOptions.variant}
          />
        </div>
      ) : null}

      {hasTemplate("showroomSection") ? (
        <div style={{ order: getSectionOrder("showroomSection", 7, 1) }}>
          <OurShowroomSection block={showroomSectionRecord} />
        </div>
      ) : null}

      {parsedBlocks.map((block, index) => {
        const template = resolveTemplateName(block);
        if (!template || customTemplates.has(template)) return null;

        return (
          <div key={`shared-${template}-${index}`} style={{ order: index * 10 }}>
            <SharedPageSectionRenderer
              block={block as Record<string, unknown>}
              template={template}
            />
          </div>
        );
      })}
    </div>
  );
}
