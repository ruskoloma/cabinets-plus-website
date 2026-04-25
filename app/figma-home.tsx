"use client";

import {
  FALLBACK_HERO_IMAGE,
  FALLBACK_PROCESS_ICONS,
  getBlock,
  mapFaqTabs,
  mapFeatures,
  mapPartnerLogos,
  mapProducts,
  mapResolvedProjects,
  resolveTemplateName,
  mapServices,
  mapStats,
  mapSteps,
  text,
  toBlockArray,
  type Dict,
  type PartnerLogoItem,
} from "@/app/figma-home.helpers";
import ContactUsSection from "@/components/shared/ContactUsSection";
import OurShowroomSection from "@/components/shared/OurShowroomSection";
import Button from "@/components/ui/Button";
import FallbackImg from "@/components/ui/FallbackImg";
import PreviewCard from "@/components/home/PreviewCard";
import ProjectMosaic from "@/components/home/ProjectMosaic";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import TrustBar from "@/components/home/TrustBar";
import TrustMessageStrip from "@/components/home/TrustMessageStrip";
import PartnersSection from "@/components/shared/PartnersSection";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";
import FillImage from "@/components/ui/FillImage";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import { tinaField } from "tinacms/dist/react";

interface Props {
  page: Dict;
}

function withLineBreaks(textValue: string, keyPrefix: string): React.ReactNode[] {
  const lines = textValue.split(/\n/);
  const out: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    if (index > 0) out.push(<br key={`${keyPrefix}-br-${index}`} />);
    if (line) out.push(line);
  });
  return out;
}

function renderHighlightedText(textValue: string, highlights: string[], emphasisClassName: string) {
  if (!textValue) return null;

  const matches = highlights
    .filter((phrase) => phrase.length > 0)
    .map((phrase) => {
      const start = textValue.indexOf(phrase);
      return start >= 0 ? { phrase, start, end: start + phrase.length } : null;
    })
    .filter((match): match is { phrase: string; start: number; end: number } => Boolean(match))
    .sort((left, right) => left.start - right.start);

  if (matches.length === 0) {
    return withLineBreaks(textValue, "plain");
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(...withLineBreaks(textValue.slice(cursor, match.start), `pre-${index}`));
    }

    nodes.push(
      <strong className={emphasisClassName} key={`${match.phrase}-${index}`}>
        {match.phrase}
      </strong>
    );
    cursor = match.end;
  });

  if (cursor < textValue.length) {
    nodes.push(...withLineBreaks(textValue.slice(cursor), "tail"));
  }

  return nodes;
}

export default function FigmaHome({ page }: Props) {
  const parsedBlocks = useResolvedSharedSectionBlocks(page.blocks);

  const hero = getBlock(parsedBlocks, "hero");
  const products = getBlock(parsedBlocks, "productsSection");
  const services = getBlock(parsedBlocks, "servicesSection");
  const projects = getBlock(parsedBlocks, "projectsSection");
  const whyUs = getBlock(parsedBlocks, "whyUsSection");
  const about = getBlock(parsedBlocks, "aboutSection");
  const showroom = getBlock(parsedBlocks, "showroomBanner");
  const process = getBlock(parsedBlocks, "processSection");
  const faq = getBlock(parsedBlocks, "faqSection");
  const contact = getBlock(parsedBlocks, "contactSection");
  const showroomSection = getBlock(parsedBlocks, "showroomSection");
  const trustStrip = getBlock(parsedBlocks, "trustStrip");
  const partnersBlock = getBlock(parsedBlocks, "partnersSection");

  const heroRecord = hero as Record<string, unknown>;
  const productsRecord = products as Record<string, unknown>;
  const servicesRecord = services as Record<string, unknown>;
  const projectsRecord = projects as Record<string, unknown>;
  const whyUsRecord = whyUs as Record<string, unknown>;
  const aboutRecord = about as Record<string, unknown>;
  const showroomRecord = showroom as Record<string, unknown>;
  const processRecord = process as Record<string, unknown>;
  const faqRecord = faq as Record<string, unknown>;
  const contactRecord = contact as Record<string, unknown>;
  const showroomSectionRecord = showroomSection as Record<string, unknown>;
  const trustStripRecord = trustStrip as Record<string, unknown>;
  const partnersRecord = partnersBlock as Record<string, unknown>;
  const heroImageOptions = resolveHomepageSectionImageOptions(heroRecord);
  const productsImageOptions = resolveHomepageSectionImageOptions(productsRecord);
  const servicesImageOptions = resolveHomepageSectionImageOptions(servicesRecord);
  const projectsImageOptions = resolveHomepageSectionImageOptions(projectsRecord);
  const whyUsImageOptions = resolveHomepageSectionImageOptions(whyUsRecord);
  const showroomImageOptions = resolveHomepageSectionImageOptions(showroomRecord);
  const contactImageOptions = resolveHomepageSectionImageOptions(contactRecord);
  const whyUsHighlights = [
    ["Our semi-custom cabinets"],
    ["We start with a free 3D design consultation"],
    ["Our installation team"],
  ];
  const introHighlight = "you can call directly";
  const processDesktopLineSegments = [
    { left: "22px", top: "65px", height: "80px" },
    { left: "22px", top: "221px", height: "80px" },
    { left: "23px", top: "380px", height: "80px" },
  ];
  const processMobileLineSegments = [
    { left: "19px", top: "66px", height: "176px" },
    { left: "18px", top: "349px", height: "222px" },
    { left: "15px", top: "666px", height: "215px" },
  ];

  const productItems = mapProducts(toBlockArray(products.products)).slice(0, 4);
  const serviceItems = mapServices(toBlockArray(services.services)).slice(0, 2);
  const featureItems = mapFeatures(toBlockArray(whyUs.features)).slice(0, 3);
  const statsItems = mapStats(toBlockArray(about.stats)).slice(0, 3);
  const processItems = mapSteps(toBlockArray(process.steps));
  const faqTabs = mapFaqTabs(toBlockArray(faq.tabs));

  const heroImage = text(hero.backgroundImage, FALLBACK_HERO_IMAGE);
  const projectMosaicItems = mapResolvedProjects(projects.projects ?? projects.resolvedProjects).slice(0, 5).map((item, index) => ({
    image: item.image,
    title: item.title,
    href: item.href,
    tinaField: tinaField(projectsRecord, `projects.${index}`),
  }));
  const partnerLogos = mapPartnerLogos(about.partnerLogos);
  const fallbackTrustPartnerLogos: PartnerLogoItem[] = [
    { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lions-floor.png", alt: "Lions Floor" },
    { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lyrus.png", alt: "Lyrus Collection" },
    { src: "/library/trust/trust-cambria.svg", alt: "Cambria" },
    { src: "/library/trust/trust-bedrosians.svg", alt: "Bedrosians" },
    { src: "/library/trust/trust-msi.svg", alt: "MSI" },
    { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-easy-stones.png", alt: "Easy Stones" },
  ];
  const trustPartnerLogos = (partnerLogos.length > 0 ? partnerLogos : fallbackTrustPartnerLogos).map((logo) => {
    const raw = logo.raw;
    return {
      ...logo,
      tinaField: raw ? tinaField(raw as Record<string, unknown>) : undefined,
      logoField: raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined,
    };
  });
  const trustStats = statsItems.map((stat) => ({
    ...stat,
    tinaField: tinaField(stat.raw as Record<string, unknown>),
    valueField: tinaField(stat.raw as Record<string, unknown>, "value"),
    labelField: tinaField(stat.raw as Record<string, unknown>, "label"),
  }));
  const showroomImage = text(showroom.image, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/showroom-banner.jpg");
  const templateOrder = parsedBlocks.reduce<Record<string, number>>((acc, block, index) => {
    const template = resolveTemplateName(block);
    if (template && acc[template] === undefined) {
      acc[template] = index;
    }
    return acc;
  }, {});

  const hasTemplate = (template: string) => templateOrder[template] !== undefined;
  const getSectionOrder = (template: string, fallbackOrder: number, offset = 0) => ((templateOrder[template] ?? fallbackOrder) * 10) + offset;
  const customTemplates = new Set([
    "hero",
    "productsSection",
    "servicesSection",
    "projectsSection",
    "whyUsSection",
    "trustStrip",
    "aboutSection",
    "showroomBanner",
    "processSection",
    "faqSection",
    "contactSection",
    "showroomSection",
    "partnersSection",
  ]);
  const resolveSectionVariant = (
    options: { useOriginal?: boolean; variant?: ImageVariantPreset },
    defaultVariant: ImageVariantPreset,
  ) => (options.useOriginal ? undefined : (options.variant ?? defaultVariant));

  return (
      <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">
      {hasTemplate("hero") ? <section className="relative h-[697px] overflow-hidden" data-tina-field={tinaField(heroRecord)} style={{ order: getSectionOrder("hero", 0) }}>
        <FillImage
          alt="Kitchen renovation"
          className="object-cover"
          data-tina-field={tinaField(heroRecord, "backgroundImage")}
          priority
          sizes="100vw"
          src={heroImage}
          variant={resolveSectionVariant(heroImageOptions, "full")}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(38,36,35,0.8)]" />

        <div className="cp-container relative h-full px-4 md:px-8">
          <div className="absolute left-4 top-[295px] w-[345px] max-w-[calc(100%-32px)] md:left-8 md:top-auto md:w-auto md:max-w-[806px] md:bottom-8">
            <h1 className="text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[56px]" data-tina-field={tinaField(heroRecord, "heading")}>
              {text(hero.heading, "Complete Kitchen & Bath Renovations in Spokane")}
            </h1>
            <p className="mt-0 max-w-[314px] text-base font-medium leading-[1.5] text-white md:mt-6 md:max-w-[560px] md:text-[18px]" data-tina-field={tinaField(heroRecord, "subtext")}>
              {text(hero.subtext, "Professional design, expert installation, and guaranteed results. From semi-custom cabinetry to stone countertops — we handle everything.")}
            </p>
            <div className="mt-[18px] md:mt-8">
              <Button dataTinaField={tinaField(heroRecord, "ctaLabel")} href={text(hero.ctaLink, "/contact-us")} variant="primary">
                {text(hero.ctaLabel, "free design Consultation")}
              </Button>
            </div>
          </div>
        </div>
      </section> : null}

      {hasTemplate("productsSection") ? <section className="cp-container px-[15px] pb-6 pt-12 md:px-[31px] md:pb-6 md:pt-16" data-tina-field={tinaField(productsRecord)} style={{ order: getSectionOrder("productsSection", 1) }}>
        <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(productsRecord, "title")}>
          {text(products.title, "Products")}
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-4 md:grid-cols-4 md:gap-x-7 md:gap-y-0">
          {productItems.map((item, index) => (
            <PreviewCard
              href={item.link || "#"}
              image={item.image}
              imageClassName="h-[173px] md:h-[440px]"
              imageVariant={productsImageOptions.useOriginal ? null : productsImageOptions.variant}
              key={`${item.name}-${index}`}
              showMobileChevron
              tinaCardField={tinaField(item.raw as Record<string, unknown>)}
              tinaImageField={tinaField(item.raw as Record<string, unknown>, "image")}
              tinaTitleField={tinaField(item.raw as Record<string, unknown>, "name")}
              title={item.name}
              titleClassName="mt-3 text-[24px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)]"
            />
          ))}
        </div>
      </section> : null}

      {hasTemplate("servicesSection") ? <section className="cp-container px-[15px] pb-12 pt-6 md:px-[30px] md:pb-[64px] md:pt-16" data-tina-field={tinaField(servicesRecord)} style={{ order: getSectionOrder("servicesSection", 2) }}>
        <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(servicesRecord, "title")}>
          {text(services.title, "Services")}
        </h2>
        <div className="mt-8 grid gap-8 md:mt-4 md:grid-cols-2 md:gap-x-[30px] md:gap-y-4">
          {serviceItems.map((item, index) => (
            <PreviewCard
              description={item.description}
              descriptionClassName="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]"
              href={item.link || "#"}
              image={item.image}
              imageClassName="h-[214px] md:h-[399px]"
              imageVariant={servicesImageOptions.useOriginal ? null : servicesImageOptions.variant}
              key={`${item.title}-${index}`}
              showMobileChevron
              tinaCardField={tinaField(item.raw as Record<string, unknown>)}
              tinaDescriptionField={tinaField(item.raw as Record<string, unknown>, "description")}
              tinaImageField={tinaField(item.raw as Record<string, unknown>, "image")}
              tinaTitleField={tinaField(item.raw as Record<string, unknown>, "title")}
              title={item.title}
              titleClassName="mt-3 text-[20px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
            />
          ))}
        </div>
      </section> : null}

      {hasTemplate("projectsSection") ? <section className="bg-[var(--cp-brand-neutral-50)] px-0 py-12 md:py-16" data-tina-field={tinaField(projectsRecord)} id="projects" style={{ order: getSectionOrder("projectsSection", 3) }}>
        <div className="cp-container px-4 md:px-8">
          <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(projectsRecord, "title")}>
            {text(projects.title, "Our projects")}
          </h2>
          <ProjectMosaic
            imageVariant={projectsImageOptions.useOriginal ? null : projectsImageOptions.variant}
            items={projectMosaicItems}
          />
          <div className="mt-12 text-center md:mt-7">
            <Button className="!min-h-12 md:!min-h-14" dataTinaField={tinaField(projectsRecord, "ctaLabel")} href={text(projects.ctaLink, "/gallery")} variant="outline">
              {text(projects.ctaLabel, "View All projects")}
            </Button>
          </div>
        </div>
      </section> : null}

      {hasTemplate("whyUsSection") ? <section className="cp-container px-[15px] py-12 md:px-[31px] md:py-16" data-tina-field={tinaField(whyUsRecord)} style={{ order: getSectionOrder("whyUsSection", 4) }}>
        <h2 className="text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(whyUsRecord, "title")}>
          {text(whyUs.title, "The difference is real:")}
        </h2>

        {text(whyUs.introText).length > 0 || text(whyUs.introText2).length > 0 ? (
          <div className="mt-8 grid gap-4 text-[18px] leading-[1.5] text-[var(--cp-primary-500)] md:mt-4 md:grid-cols-[559px_minmax(0,1fr)] md:gap-20 md:py-8 md:text-[24px] md:leading-[1.45]">
            {text(whyUs.introText).length > 0 ? (
              <p data-tina-field={tinaField(whyUsRecord, "introText")}>
                {text(whyUs.introText)}
              </p>
            ) : null}
            {text(whyUs.introText2).length > 0 ? (
              <p data-tina-field={tinaField(whyUsRecord, "introText2")}>
                {renderHighlightedText(text(whyUs.introText2), [introHighlight], "font-black")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 md:mt-4 md:grid-cols-3 md:gap-5 lg:gap-7">
          {featureItems.map((item, index) => (
            <article className="flex flex-col" data-tina-field={tinaField(item.raw as Record<string, unknown>)} key={`${item.title}-${index}`}>
              <div className="relative h-[373px] overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] md:h-[455px]" data-tina-field={tinaField(item.raw as Record<string, unknown>, "image")}>
                {item.image ? <FillImage alt={item.title} className="object-cover" sizes="(min-width: 768px) 31vw, 100vw" src={item.image} variant={resolveSectionVariant(whyUsImageOptions, "card")} /> : null}
              </div>
              <h3
                className="mt-3 text-[20px] font-semibold leading-[1.15] text-[var(--cp-primary-500)] md:text-[24px] md:leading-[1.25]"
                data-tina-field={tinaField(item.raw as Record<string, unknown>, "title")}
              >
                {item.title}
              </h3>
              {item.description ? (
                <p
                  className="mt-2 text-base leading-[1.45] text-[var(--cp-primary-500)] md:text-[18px] md:leading-[1.5]"
                  data-tina-field={tinaField(item.raw as Record<string, unknown>, "description")}
                >
                  {renderHighlightedText(item.description, whyUsHighlights[index] ?? [], "font-semibold")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section> : null}

      {hasTemplate("trustStrip") ? <div style={{ order: getSectionOrder("trustStrip", 5) }}>
        <TrustMessageStrip block={trustStripRecord} />
      </div> : null}

      {hasTemplate("aboutSection") ? <div data-tina-field={tinaField(aboutRecord)} style={{ order: getSectionOrder("aboutSection", 6) }}>
        <TrustBar
          ctaLabel={text(about.ctaLabel, "About us")}
          ctaLabelField={tinaField(aboutRecord, "ctaLabel")}
          ctaLink={text(about.ctaLink, "/about-us")}
          membershipLabel={text(about.membershipLabel, "Membership")}
          membershipLabelField={tinaField(aboutRecord, "membershipLabel")}
          membershipLogo={text(about.membershipDesktopLogo, "/library/trust/trust-membership.svg")}
          membershipLogoField={tinaField(aboutRecord, "membershipDesktopLogo")}
          membershipMobileBottomLogo={text(about.membershipMobileBottomLogo, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-membership-mobile-bottom.png")}
          membershipMobileBottomLogoField={tinaField(aboutRecord, "membershipMobileBottomLogo")}
          membershipMobileTopLogo={text(about.membershipMobileTopLogo, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-shba.png")}
          membershipMobileTopLogoField={tinaField(aboutRecord, "membershipMobileTopLogo")}
          partnerLogos={trustPartnerLogos}
          partnershipLabel={text(about.partnershipLabel, "Exclusive Partnership")}
          partnershipLabelField={tinaField(aboutRecord, "partnershipLabel")}
          stats={trustStats}
        />
      </div> : null}

      {hasTemplate("showroomBanner") ? <section className="relative h-[697px] overflow-hidden" data-tina-field={tinaField(showroomRecord)} style={{ order: getSectionOrder("showroomBanner", 7) }}>
        <FillImage
          alt="Showroom"
          className="object-cover object-center"
          data-tina-field={tinaField(showroomRecord, "image")}
          sizes="100vw"
          src={showroomImage}
          variant={resolveSectionVariant(showroomImageOptions, "full")}
        />
        <div className="absolute inset-0 bg-[rgba(38,38,35,0.4)] md:hidden" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(38,38,35,0.6)_0%,rgba(38,38,35,0.45)_50%,rgba(38,38,35,0)_100%)] md:block" />

        <div className="cp-container relative h-full px-4 md:px-8">
          <div className="absolute left-8 top-[208px] w-[345px] max-w-[calc(100%-32px)] md:left-[136px] md:top-[150px] md:w-[549px] md:max-w-none">
            <h2 className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px] md:font-normal" data-tina-field={tinaField(showroomRecord, "heading")}>
              {text(showroom.heading, "Spokane's Premier Cabinet & Stone Showroom")}
            </h2>
            <p className="mt-4 max-w-[314px] text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:max-w-none md:text-[24px] md:font-normal" data-tina-field={tinaField(showroomRecord, "subtext")}>
              {text(showroom.subtext, "Factory-direct semi-custom cabinets, granite & quartz countertops, and flooring. Experience quality before you buy.")}
            </p>
            <div className="mt-6 md:mt-8">
              <Button className="!border-white !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white" dataTinaField={tinaField(showroomRecord, "ctaLabel")} href={text(showroom.ctaLink, "/contact-us")} variant="outline">
                {text(showroom.ctaLabel, "Visit Our Showroom")}
              </Button>
            </div>
          </div>
        </div>
      </section> : null}

      {hasTemplate("processSection") ? <section className="bg-[var(--cp-brand-neutral-50)] py-20" data-tina-field={tinaField(processRecord)} style={{ order: getSectionOrder("processSection", 8) }}>
        <div className="cp-container px-4 md:px-[130px]">
          <h2 className="text-center text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(processRecord, "title")}>
            {text(process.title, "Our process")}
          </h2>

          <div className="relative mx-auto mt-12 w-full max-w-[361px] md:max-w-[1018px]">
            {processMobileLineSegments.map((segment, index) => (
              <span
                className="absolute w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:hidden"
                key={`process-mobile-line-${index}`}
                style={{ height: segment.height, left: segment.left, top: segment.top }}
              />
            ))}
            {processDesktopLineSegments.map((segment, index) => (
              <span
                className="absolute hidden w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:block"
                key={`process-desktop-line-${index}`}
                style={{ height: segment.height, left: segment.left, top: segment.top }}
              />
            ))}

            <div className="flex flex-col gap-12">
              {processItems.map((item, index) => {
                const iconSizeClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
                const iconMaskClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
                const iconSrc = item.iconImage || FALLBACK_PROCESS_ICONS[index];
                return (
                  <article className="grid items-start grid-cols-[40px_1fr] gap-6 md:grid-cols-[48px_1fr]" data-tina-field={tinaField(item.raw as Record<string, unknown>)} key={`${item.title}-${index}`}>
                    <div className="relative z-10 flex justify-center">
                      <div className={`flex items-center justify-center bg-[var(--cp-brand-neutral-50)] ${iconMaskClass}`}>
                        {iconSrc ? <FallbackImg alt="" aria-hidden className={`${iconSizeClass} object-contain`} data-tina-field={tinaField(item.raw as Record<string, unknown>, "iconImage")} src={iconSrc} variant="thumb" /> : null}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-[var(--font-red-hat-display)] text-[20px] font-normal leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]" data-tina-field={tinaField(item.raw as Record<string, unknown>, "title")}>
                        {item.title}
                      </h3>
                      <p className="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)]" data-tina-field={tinaField(item.raw as Record<string, unknown>, "description")}>
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section> : null}

      {hasTemplate("faqSection") ? <section className="bg-[#edebe5] py-8 md:py-16" data-tina-field={tinaField(faqRecord)} id="faq" style={{ order: getSectionOrder("faqSection", 9) }}>
        <div className="cp-container px-4 md:px-8">
          <h2 className="text-center text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(faqRecord, "title")}>
            {text(faq.title, "F.A.Q.")}
          </h2>
          <FaqTabsAccordion tabs={faqTabs} />
        </div>
      </section> : null}

      {hasTemplate("contactSection") ? <div style={{ order: getSectionOrder("contactSection", 10, 0) }}>
        <ContactUsSection block={contactRecord} imageVariant={contactImageOptions.useOriginal ? null : contactImageOptions.variant} />
      </div> : null}

      {hasTemplate("partnersSection") ? <div style={{ order: getSectionOrder("partnersSection", 11) }}>
        <PartnersSection block={partnersRecord} />
      </div> : null}

      {hasTemplate("showroomSection") ? <div style={{ order: getSectionOrder("showroomSection", 10, 1) }}>
        <OurShowroomSection block={showroomSectionRecord} />
      </div> : null}

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
