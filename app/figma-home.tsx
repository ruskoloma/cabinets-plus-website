"use client";

import { useGlobal } from "@/components/layout/GlobalContext";
import Button from "@/components/ui/Button";
import PreviewCard from "@/components/home/PreviewCard";
import ProjectMosaic from "@/components/home/ProjectMosaic";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import ContactForm from "@/components/home/ContactForm";
import TrustBar from "@/components/home/TrustBar";
import { tinaField } from "tinacms/dist/react";

interface Props {
  page: Dict;
}

interface HomeBlock {
  _template?: string;
  __typename?: string | null;
  [key: string]: unknown;
}

interface Dict {
  [key: string]: unknown;
}

interface ProductItem {
  raw: Dict;
  name: string;
  link: string;
  image?: string;
}

interface ServiceItem {
  raw: Dict;
  title: string;
  description: string;
  link: string;
  image?: string;
}

interface FeatureItem {
  raw: Dict;
  icon?: string;
  title: string;
  description: string;
  image?: string;
}

interface StatItem {
  raw: Dict;
  value: string;
  label: string;
}

interface PartnerLogoItem {
  raw?: Dict;
  src: string;
  alt: string;
}

interface ProcessItem {
  raw: Dict;
  iconImage?: string;
  title: string;
  description: string;
}

interface FaqItem {
  raw?: Dict;
  question: string;
  answer: string;
}

interface FaqTab {
  raw?: Dict;
  label: string;
  faqs: FaqItem[];
}

const fallbackHeroImage = "/figma/home/hero.jpg";
const fallbackProjectImages = [
  "/figma/home/project-main.jpg",
  "/figma/home/project-2.jpg",
  "/figma/home/project-3.jpg",
  "/figma/home/project-4.jpg",
  "/figma/home/project-5.jpg",
];
const fallbackProcessIcons = [
  "/figma/assets/process-step-1.svg",
  "/figma/assets/process-step-2.svg",
  "/figma/assets/process-step-3.svg",
  "/figma/assets/process-step-4.svg",
];

const TYPE_TO_TEMPLATE: Record<string, string> = {
  PageBlocksHero: "hero",
  PageBlocksProductsSection: "productsSection",
  PageBlocksServicesSection: "servicesSection",
  PageBlocksProjectsSection: "projectsSection",
  PageBlocksWhyUsSection: "whyUsSection",
  PageBlocksAboutSection: "aboutSection",
  PageBlocksShowroomBanner: "showroomBanner",
  PageBlocksProcessSection: "processSection",
  PageBlocksFaqSection: "faqSection",
  PageBlocksContactSection: "contactSection",
};

const fallbackFaqTabs: FaqTab[] = [
  {
    label: "General Questions",
    faqs: [
      {
        question: "Can you provide advice on DIY projects?",
        answer: "Yes. We offer consultations for DIY projects and can help with selections, planning, and measurements.",
      },
    ],
  },
];

function toBlockArray(value: unknown): HomeBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is HomeBlock => Boolean(item) && typeof item === "object");
}

function toDict(value: unknown): Dict {
  return value && typeof value === "object" ? (value as Dict) : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function resolveTemplateName(block: HomeBlock): string {
  if (typeof block._template === "string" && block._template.length > 0) return block._template;
  if (typeof block.__typename === "string") return TYPE_TO_TEMPLATE[block.__typename] || "";
  return "";
}

function getBlock(blocks: HomeBlock[], template: string): Dict {
  return toDict(blocks.find((block) => resolveTemplateName(block) === template));
}

function mapProducts(list: HomeBlock[]): ProductItem[] {
  return list
    .map((item) => {
      const raw = toDict(item);
      return {
        raw,
        name: text(raw.name),
        link: text(raw.link),
        image: text(raw.image) || undefined,
      };
    })
    .filter((item) => item.name.length > 0);
}

function mapServices(list: HomeBlock[]): ServiceItem[] {
  return list
    .map((item) => {
      const raw = toDict(item);
      return {
        raw,
        title: text(raw.title),
        description: text(raw.description),
        link: text(raw.link),
        image: text(raw.image) || undefined,
      };
    })
    .filter((item) => item.title.length > 0);
}

function mapFeatures(list: HomeBlock[]): FeatureItem[] {
  return list
    .map((item) => {
      const raw = toDict(item);
      return {
        raw,
        icon: text(raw.icon) || undefined,
        title: text(raw.title),
        description: text(raw.description),
        image: text(raw.image) || undefined,
      };
    })
    .filter((item) => item.title.length > 0);
}

function mapStats(list: HomeBlock[]): StatItem[] {
  return list
    .map((item) => {
      const raw = toDict(item);
      return { raw, value: text(raw.value), label: text(raw.label) };
    })
    .filter((item) => item.value.length > 0 || item.label.length > 0);
}

function mapPartnerLogos(value: unknown): PartnerLogoItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return { src: item, alt: "Partner logo" };
      }

      const mapped = toDict(item);
      return {
        raw: mapped,
        src: text(mapped.logo),
        alt: text(mapped.alt, "Partner logo"),
      };
    })
    .filter((item) => item.src.length > 0);
}

function mapSteps(list: HomeBlock[]): ProcessItem[] {
  return list
    .map((item) => {
      const raw = toDict(item);
      return {
        raw,
        iconImage: text(raw.iconImage) || undefined,
        title: text(raw.title),
        description: text(raw.description),
      };
    })
    .filter((item) => item.title.length > 0);
}

function mapFaqTabs(list: HomeBlock[]): FaqTab[] {
  const tabs = list
    .map((tab) => {
      const rawTab = toDict(tab);
      return {
        raw: rawTab,
        label: text(rawTab.label),
        faqs: toBlockArray(rawTab.faqs)
          .map((faq) => {
            const rawFaq = toDict(faq);
            return { raw: rawFaq, question: text(rawFaq.question), answer: text(rawFaq.answer) };
          })
          .filter((faq) => faq.question.length > 0),
      };
    })
    .filter((tab) => tab.label.length > 0);

  return tabs.length > 0 ? tabs : fallbackFaqTabs;
}

function MailIcon() {
  return <img alt="" aria-hidden className="h-10 w-10 md:h-12 md:w-12" src="/figma/assets/showroom-icon-mail.svg" />;
}

function PhoneIcon() {
  return <img alt="" aria-hidden className="h-10 w-10 md:h-12 md:w-12" src="/figma/assets/showroom-icon-phone.svg" />;
}

function LocationIcon() {
  return <img alt="" aria-hidden className="h-10 w-10 md:h-12 md:w-12" src="/figma/assets/showroom-icon-location.svg" />;
}

function FacebookIcon() {
  return <img alt="" aria-hidden className="h-8 w-8 md:h-10 md:w-10" src="/figma/assets/showroom-social-facebook.svg" />;
}

function InstagramIcon() {
  return <img alt="" aria-hidden className="h-8 w-8 md:h-10 md:w-10" src="/figma/assets/showroom-social-instagram.svg" />;
}

function PinterestIcon() {
  return <img alt="" aria-hidden className="h-8 w-8 md:h-10 md:w-10" src="/figma/assets/showroom-social-pinterest.svg" />;
}

export default function FigmaHome({ page }: Props) {
  const global = useGlobal();
  const parsedBlocks = toBlockArray(page.blocks);

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
  const globalRecord = global as unknown as Record<string, unknown>;

  const productItems = mapProducts(toBlockArray(products.products)).slice(0, 4);
  const serviceItems = mapServices(toBlockArray(services.services)).slice(0, 2);
  const featureItems = mapFeatures(toBlockArray(whyUs.features)).slice(0, 3);
  const statsItems = mapStats(toBlockArray(about.stats)).slice(0, 3);
  const processItems = mapSteps(toBlockArray(process.steps));
  const faqTabs = mapFaqTabs(toBlockArray(faq.tabs));

  const heroImage = text(hero.backgroundImage, fallbackHeroImage);
  const projectGallery = (Array.isArray(projects.images) ? (projects.images as unknown[]) : []).map((item) => text(item)).filter(Boolean);
  const projectImages = projectGallery.length > 0 ? projectGallery : fallbackProjectImages;
  const projectImageFields = projectGallery.map((_, index) => tinaField(projectsRecord, `images.${index}`));
  const partnerLogos = mapPartnerLogos(about.partnerLogos);
  const fallbackTrustPartnerLogos = [
    { src: "/figma/assets/trust-lions-floor.png", alt: "Lions Floor" },
    { src: "/figma/assets/trust-lyrus.png", alt: "Lyrus Collection" },
    { src: "/figma/assets/trust-cambria.svg", alt: "Cambria" },
    { src: "/figma/assets/trust-bedrosians.svg", alt: "Bedrosians" },
    { src: "/figma/assets/trust-msi.svg", alt: "MSI" },
    { src: "/figma/assets/trust-easy-stones.png", alt: "Easy Stones" },
  ];
  const trustPartnerLogos = (partnerLogos.length > 0 ? partnerLogos : fallbackTrustPartnerLogos).map((logo) => {
    const raw = "raw" in logo ? logo.raw : undefined;
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

  const contactImage = text(contact.image, "/figma/home/contact-figma.jpg");
  const showroomImage = text(showroom.image, "/figma/home/showroom-banner.jpg");
  const mapEmbedUrl = text(
    contact.mapEmbedUrl,
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2687.4219204649216!2d-117.34231340000001!3d47.6567994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x549e1f2329ca588f%3A0x5d5cbf04120a6e84!2sCabinets%20Plus!5e0!3m2!1sen!2sus!4v1772842605411!5m2!1sen!2sus"
  );
  const pinterestUrl = global.pinterestUrl || "https://www.pinterest.com/";
  const templateOrder = parsedBlocks.reduce<Record<string, number>>((acc, block, index) => {
    const template = resolveTemplateName(block);
    if (template && acc[template] === undefined) {
      acc[template] = index;
    }
    return acc;
  }, {});

  const hasTemplate = (template: string) => templateOrder[template] !== undefined;
  const getSectionOrder = (template: string, fallbackOrder: number, offset = 0) => ((templateOrder[template] ?? fallbackOrder) * 10) + offset;

  return (
    <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">
      {hasTemplate("hero") ? <section className="relative h-[697px] overflow-hidden" data-tina-field={tinaField(heroRecord)} style={{ order: getSectionOrder("hero", 0) }}>
        <img alt="Kitchen renovation" className="absolute inset-0 h-full w-full object-cover" data-tina-field={tinaField(heroRecord, "backgroundImage")} src={heroImage} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(38,36,35,0.8)]" />

        <div className="cp-container relative h-full px-8">
          <div className="absolute bottom-10 max-w-[806px] md:bottom-16">
            <h1 className="text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[56px]" data-tina-field={tinaField(heroRecord, "heading")}>
              {text(hero.heading, "Complete Kitchen & Bath Renovations in Spokane")}
            </h1>
            <p className="mt-4 max-w-[560px] text-base font-medium leading-[1.5] text-white md:mt-6 md:text-[18px]" data-tina-field={tinaField(heroRecord, "subtext")}>
              {text(hero.subtext, "Professional design, expert installation, and guaranteed results. From semi-custom cabinetry to stone countertops — we handle everything.")}
            </p>
            <div className="mt-8">
              <Button dataTinaField={tinaField(heroRecord, "ctaLabel")} href={text(hero.ctaLink, "/contact-us")} variant="primary">
                {text(hero.ctaLabel, "free design Consultation")}
              </Button>
            </div>
          </div>
        </div>
      </section> : null}

      {hasTemplate("productsSection") ? <section className="cp-container px-4 py-16 md:px-8" data-tina-field={tinaField(productsRecord)} style={{ order: getSectionOrder("productsSection", 1) }}>
        <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(productsRecord, "title")}>
          {text(products.title, "Products")}
        </h2>
        <div className="mt-7 grid grid-cols-1 gap-7 md:grid-cols-4">
          {productItems.map((item, index) => (
            <PreviewCard
              href={item.link || "#"}
              image={item.image}
              imageClassName="h-[440px]"
              key={`${item.name}-${index}`}
              tinaCardField={tinaField(item.raw as Record<string, unknown>)}
              tinaImageField={tinaField(item.raw as Record<string, unknown>, "image")}
              tinaTitleField={tinaField(item.raw as Record<string, unknown>, "name")}
              title={item.name}
            />
          ))}
        </div>
      </section> : null}

      {hasTemplate("servicesSection") ? <section className="cp-container px-4 py-16 md:px-8" data-tina-field={tinaField(servicesRecord)} style={{ order: getSectionOrder("servicesSection", 2) }}>
        <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(servicesRecord, "title")}>
          {text(services.title, "Services")}
        </h2>
        <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-7">
          {serviceItems.map((item, index) => (
            <PreviewCard
              description={item.description}
              descriptionClassName="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]"
              image={item.image}
              imageClassName="h-[214px] md:h-[399px]"
              key={`${item.title}-${index}`}
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

      {hasTemplate("projectsSection") ? <section className="bg-[var(--cp-brand-neutral-50)] py-16" data-tina-field={tinaField(projectsRecord)} id="projects" style={{ order: getSectionOrder("projectsSection", 3) }}>
        <div className="cp-container px-4 md:px-8">
          <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(projectsRecord, "title")}>
            {text(projects.title, "Our projects")}
          </h2>
          <ProjectMosaic imageFields={projectImageFields} images={projectImages} />
          <div className="mt-7 text-center">
            <Button dataTinaField={tinaField(projectsRecord, "ctaLabel")} href={text(projects.ctaLink, "/gallery")} variant="outline">
              {text(projects.ctaLabel, "View All projects")}
            </Button>
          </div>
        </div>
      </section> : null}

      {hasTemplate("whyUsSection") ? <section className="cp-container px-4 py-16 md:px-8" data-tina-field={tinaField(whyUsRecord)} style={{ order: getSectionOrder("whyUsSection", 4) }}>
        <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(whyUsRecord, "title")}>
          {text(whyUs.title, "The difference is real:")}
        </h2>

        {text(whyUs.introText).length > 0 || text(whyUs.introText2).length > 0 ? (
          <div className="mt-5 space-y-3 text-[18px] leading-[1.5] text-[var(--cp-primary-500)] md:max-w-[960px]">
            {text(whyUs.introText).length > 0 ? <p data-tina-field={tinaField(whyUsRecord, "introText")}>{text(whyUs.introText)}</p> : null}
            {text(whyUs.introText2).length > 0 ? <p data-tina-field={tinaField(whyUsRecord, "introText2")}>{text(whyUs.introText2)}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-7">
          {featureItems.map((item, index) => (
            <PreviewCard
              description={item.description}
              descriptionClassName="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]"
              image={item.image}
              imageClassName="h-[373px] md:h-[455px]"
              key={`${item.title}-${index}`}
              tinaCardField={tinaField(item.raw as Record<string, unknown>)}
              tinaDescriptionField={tinaField(item.raw as Record<string, unknown>, "description")}
              tinaImageField={tinaField(item.raw as Record<string, unknown>, "image")}
              tinaTitleField={tinaField(item.raw as Record<string, unknown>, "title")}
              title={item.title}
              titleClassName="mt-3 text-[20px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
            />
          ))}
        </div>
      </section> : null}

      {hasTemplate("aboutSection") ? <div data-tina-field={tinaField(aboutRecord)} style={{ order: getSectionOrder("aboutSection", 5) }}>
        <TrustBar
          ctaLabel={text(about.ctaLabel, "About Us")}
          ctaLabelField={tinaField(aboutRecord, "ctaLabel")}
          ctaLink={text(about.ctaLink, "/about-us")}
          membershipLabel={text(about.membershipLabel, "Membership")}
          membershipLabelField={tinaField(aboutRecord, "membershipLabel")}
          membershipLogo={text(about.membershipDesktopLogo, "/figma/assets/trust-membership.svg")}
          membershipLogoField={tinaField(aboutRecord, "membershipDesktopLogo")}
          membershipMobileBottomLogo={text(about.membershipMobileBottomLogo, "/figma/assets/trust-membership-mobile-bottom.png")}
          membershipMobileBottomLogoField={tinaField(aboutRecord, "membershipMobileBottomLogo")}
          membershipMobileTopLogo={text(about.membershipMobileTopLogo, "/figma/assets/trust-shba.png")}
          membershipMobileTopLogoField={tinaField(aboutRecord, "membershipMobileTopLogo")}
          partnerLogos={trustPartnerLogos}
          partnershipLabel={text(about.partnershipLabel, "Exclusive Partnership")}
          partnershipLabelField={tinaField(aboutRecord, "partnershipLabel")}
          stats={trustStats}
          stripHighlightField={tinaField(aboutRecord, "trustStripHighlight")}
          stripHighlight={text(about.trustStripHighlight, "you can call directly")}
          stripTextField={tinaField(aboutRecord, "trustStripText")}
          stripText={text(
            about.trustStripText,
            "You're buying from people you can call directly if anything needs attention, not a 1-800 number three states away."
          )}
          stripTextureField={tinaField(aboutRecord, "trustStripTexture")}
          stripTexture={text(about.trustStripTexture, "/figma/assets/trust-strip-texture.jpg")}
        />
      </div> : null}

      {hasTemplate("showroomBanner") ? <section className="relative h-[697px] overflow-hidden" data-tina-field={tinaField(showroomRecord)} style={{ order: getSectionOrder("showroomBanner", 6) }}>
        <img alt="Showroom" className="absolute inset-0 h-full w-full object-cover object-center" data-tina-field={tinaField(showroomRecord, "image")} src={showroomImage} />
        <div className="absolute inset-0 bg-[rgba(38,38,35,0.4)] md:hidden" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(38,38,35,0.6)_0%,rgba(38,38,35,0.45)_50%,rgba(38,38,35,0)_100%)] md:block" />

        <div className="cp-container relative h-full px-4 md:px-8">
          <div className="absolute left-8 top-[208px] w-[314px] md:left-[136px] md:top-[150px] md:w-[549px]">
            <h2 className="font-[var(--font-red-hat-display)] text-[32px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px] md:font-normal" data-tina-field={tinaField(showroomRecord, "heading")}>
              {text(showroom.heading, "Spokane's Premier Cabinet & Stone Showroom")}
            </h2>
            <p className="mt-4 text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:text-[24px] md:font-normal" data-tina-field={tinaField(showroomRecord, "subtext")}>
              {text(showroom.subtext, "Factory-direct semi-custom cabinets, granite & quartz countertops, and flooring. Experience quality before you buy.")}
            </p>
            <div className="mt-6 md:mt-8">
              <Button className="!border-white !text-white hover:!border-white hover:!bg-white/10 hover:!text-white" dataTinaField={tinaField(showroomRecord, "ctaLabel")} href={text(showroom.ctaLink, "/contact-us")} variant="outline">
                {text(showroom.ctaLabel, "Visit Our Showroom")}
              </Button>
            </div>
          </div>
        </div>
      </section> : null}

      {hasTemplate("processSection") ? <section className="bg-[var(--cp-brand-neutral-50)] py-16 md:py-20" data-tina-field={tinaField(processRecord)} style={{ order: getSectionOrder("processSection", 7) }}>
        <div className="cp-container px-4 md:px-8">
          <h2 className="text-center text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(processRecord, "title")}>
            {text(process.title, "Our process")}
          </h2>

          <div className="relative mx-auto mt-12 max-w-[1018px]">
            <span className="absolute left-[19px] top-[66px] h-[176px] w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:hidden" />
            <span className="absolute left-[18px] top-[349px] h-[222px] w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:hidden" />
            <span className="absolute left-[15px] top-[666px] h-[215px] w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:hidden" />
            <span className="absolute left-[22px] top-[65px] hidden h-20 w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:block" />
            <span className="absolute left-[22px] top-[221px] hidden h-20 w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:block" />
            <span className="absolute left-[23px] top-[380px] hidden h-20 w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:block" />

            <div className="flex flex-col gap-12">
              {processItems.map((item, index) => {
                const iconSizeClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
                const iconSrc = item.iconImage || fallbackProcessIcons[index];
                return (
                  <article className="grid grid-cols-[40px_1fr] gap-6 md:grid-cols-[48px_1fr]" data-tina-field={tinaField(item.raw as Record<string, unknown>)} key={`${item.title}-${index}`}>
                    <div className="relative z-10 flex justify-center bg-[var(--cp-brand-neutral-50)]">
                      {iconSrc ? <img alt="" aria-hidden className={`${iconSizeClass} object-contain`} data-tina-field={tinaField(item.raw as Record<string, unknown>, "iconImage")} src={iconSrc} /> : null}
                    </div>
                    <div className="pt-0.5">
                      <h3 className="font-[var(--font-red-hat-display)] text-[20px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]" data-tina-field={tinaField(item.raw as Record<string, unknown>, "title")}>
                        {item.title}
                      </h3>
                      <p className="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)]/90" data-tina-field={tinaField(item.raw as Record<string, unknown>, "description")}>
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

      {hasTemplate("faqSection") ? <section className="bg-[var(--cp-brand-neutral-50)] py-16" data-tina-field={tinaField(faqRecord)} id="faq" style={{ order: getSectionOrder("faqSection", 8) }}>
        <div className="cp-container px-4 md:px-8">
          <h2 className="text-center text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(faqRecord, "title")}>
            {text(faq.title, "F.A.Q.")}
          </h2>
          <FaqTabsAccordion tabs={faqTabs} />
        </div>
      </section> : null}

      {hasTemplate("contactSection") ? <section className="bg-[var(--cp-brand-neutral-100)]" data-tina-field={tinaField(contactRecord)} style={{ order: getSectionOrder("contactSection", 9, 0) }}>
        <div className="mx-auto w-full max-w-[1440px] md:grid md:grid-cols-[720px_720px]">
          <div className="px-[43px] pb-12 pt-[35px] md:pl-[79px] md:pr-[91px] md:pb-[82px] md:pt-16">
            <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(contactRecord, "title")}>
              {text(contact.title, "Contact us")}
            </h2>

            <div className="mt-[54px] w-full max-w-[550px] md:mt-[39px]">
              <ContactForm
                emailLabel={text(contact.emailLabel, "Email")}
                emailLabelField={tinaField(contactRecord, "emailLabel")}
                emailPlaceholder={text(contact.emailPlaceholder, "Enter your email")}
                emailPlaceholderField={tinaField(contactRecord, "emailPlaceholder")}
                messageLabel={text(contact.messageLabel, "Project Idea (optional)")}
                messageLabelField={tinaField(contactRecord, "messageLabel")}
                messagePlaceholder={text(contact.messagePlaceholder, "Tell us more about your project")}
                messagePlaceholderField={tinaField(contactRecord, "messagePlaceholder")}
                nameLabel={text(contact.nameLabel, "Name")}
                nameLabelField={tinaField(contactRecord, "nameLabel")}
                namePlaceholder={text(contact.namePlaceholder, "Enter your name")}
                namePlaceholderField={tinaField(contactRecord, "namePlaceholder")}
                submitLabel={text(contact.submitLabel, "Send request")}
                submitLabelField={tinaField(contactRecord, "submitLabel")}
              />
            </div>
          </div>

          <div className="h-[380px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[697px] md:w-[720px]" data-tina-field={tinaField(contactRecord, "image")}>
            <img alt="Contact section" className="h-full w-full object-cover" src={contactImage} />
          </div>
        </div>
      </section> : null}

      {hasTemplate("contactSection") ? <section className="relative overflow-hidden bg-[var(--cp-brand-neutral-50)] py-16" data-tina-field={tinaField(contactRecord)} style={{ order: getSectionOrder("contactSection", 9, 1) }}>
        <div className="absolute inset-0 bg-[#f2f2f2]" />
        <img alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" src="/figma/home/showroom-texture.png" />

        <div className="cp-container relative px-4 md:px-0">
          <div className="mx-auto grid max-w-[1248px] gap-12 md:grid-cols-[412px_623px] md:justify-between md:gap-10">
            <div>
              <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(contactRecord, "showroomTitle")}>
                {text(contact.showroomTitle, "Our showroom")}
              </h2>

              <div className="mt-16 space-y-8 text-[var(--cp-primary-500)]">
                <div className="flex items-center gap-5">
                  <LocationIcon />
                  <div className="text-[16px] leading-[1.5] md:text-[18px]">
                    <p className="font-semibold" data-tina-field={tinaField(globalRecord, "address")}>
                      {global.address.split(",")[0].trim()}
                    </p>
                    <p data-tina-field={tinaField(globalRecord, "hours")}>{global.hours}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <MailIcon />
                  <p className="text-[16px] leading-[1.5] md:text-[18px]" data-tina-field={tinaField(globalRecord, "email")}>
                    {global.email}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <PhoneIcon />
                  <p className="text-[16px] leading-[1.5] md:text-[18px]" data-tina-field={tinaField(globalRecord, "phone")}>
                    {global.phone}
                  </p>
                </div>
              </div>

              <div className="mt-16">
                <p className="font-[var(--font-red-hat-display)] text-[20px] font-semibold md:text-[24px]" data-tina-field={tinaField(contactRecord, "followUsLabel")}>
                  {text(contact.followUsLabel, "Follow us")}
                </p>
                <div className="mt-4 flex items-center gap-4 md:gap-6">
                  <a aria-label="Pinterest" className="transition-opacity hover:opacity-75" data-tina-field={tinaField(globalRecord, "pinterestUrl")} href={pinterestUrl} rel="noreferrer" target="_blank">
                    <PinterestIcon />
                  </a>
                  {global.instagramUrl ? (
                    <a aria-label="Instagram" className="transition-opacity hover:opacity-75" data-tina-field={tinaField(globalRecord, "instagramUrl")} href={global.instagramUrl} rel="noreferrer" target="_blank">
                      <InstagramIcon />
                    </a>
                  ) : null}
                  {global.facebookUrl ? (
                    <a aria-label="Facebook" className="transition-opacity hover:opacity-75" data-tina-field={tinaField(globalRecord, "facebookUrl")} href={global.facebookUrl} rel="noreferrer" target="_blank">
                      <FacebookIcon />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="relative h-[322px] overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] md:h-[555px] md:w-[623px]" data-tina-field={tinaField(contactRecord, "mapEmbedUrl")}>
              <iframe
                allowFullScreen
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapEmbedUrl}
                title="Cabinets Plus map"
              />
            </div>
          </div>
        </div>
      </section> : null}
    </div>
  );
}
