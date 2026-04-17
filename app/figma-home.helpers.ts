export interface Dict {
  [key: string]: unknown;
}

export interface HomeBlock {
  _template?: string;
  __typename?: string | null;
  [key: string]: unknown;
}

export interface ProductItem {
  raw: Dict;
  name: string;
  link: string;
  image?: string;
}

export interface ServiceItem {
  raw: Dict;
  title: string;
  description: string;
  link: string;
  image?: string;
}

export interface FeatureItem {
  raw: Dict;
  icon?: string;
  title: string;
  description: string;
  image?: string;
}

export interface StatItem {
  raw: Dict;
  value: string;
  label: string;
}

export interface PartnerLogoItem {
  raw?: Dict;
  src: string;
  alt: string;
  href?: string;
}

export interface ProcessItem {
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

export interface FaqTab {
  raw?: Dict;
  label: string;
  faqs: FaqItem[];
}

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
  PageBlocksTrustStrip: "trustStrip",
  PageBlocksAboutStorySection: "aboutStorySection",
  PageBlocksPartnersSection: "partnersSection",
  PageBlocksTextImageSection: "textImageSection",
  // Cabinet page-settings blocks
  PageSettingsCabinetBlocksCabinetProductInfo: "cabinetProductInfo",
  PageSettingsCabinetBlocksProjectsUsingThisProduct: "projectsUsingThisProduct",
  PageSettingsCabinetBlocksRelatedProducts: "relatedProducts",
  PageSettingsCabinetBlocksTextImageSection: "textImageSection",
  PageSettingsCabinetBlocksFaqSection: "faqSection",
  PageSettingsCabinetBlocksShowroomBanner: "showroomBanner",
  PageSettingsCabinetBlocksPartnersSection: "partnersSection",
  PageSettingsCabinetBlocksContactSection: "contactSection",
  // Countertop page-settings blocks
  PageSettingsCountertopBlocksCountertopProductInfo: "countertopProductInfo",
  PageSettingsCountertopBlocksProjectsUsingThisProduct: "projectsUsingThisProduct",
  PageSettingsCountertopBlocksRelatedProducts: "relatedProducts",
  PageSettingsCountertopBlocksTextImageSection: "textImageSection",
  PageSettingsCountertopBlocksFaqSection: "faqSection",
  PageSettingsCountertopBlocksShowroomBanner: "showroomBanner",
  PageSettingsCountertopBlocksPartnersSection: "partnersSection",
  PageSettingsCountertopBlocksContactSection: "contactSection",
  // Flooring page-settings blocks
  PageSettingsFlooringBlocksFlooringProductInfo: "flooringProductInfo",
  PageSettingsFlooringBlocksProjectsUsingThisProduct: "projectsUsingThisProduct",
  PageSettingsFlooringBlocksRelatedProducts: "relatedProducts",
  PageSettingsFlooringBlocksTextImageSection: "textImageSection",
  PageSettingsFlooringBlocksFaqSection: "faqSection",
  PageSettingsFlooringBlocksShowroomBanner: "showroomBanner",
  PageSettingsFlooringBlocksPartnersSection: "partnersSection",
  PageSettingsFlooringBlocksContactSection: "contactSection",
};

const FALLBACK_FAQ_TABS: FaqTab[] = [
  {
    label: "General Questions",
    faqs: [
      {
        question: "Can you provide advice on DIY projects?",
        answer:
          "Yes. We offer consultations for DIY projects and can help with selections, planning, and measurements.",
      },
    ],
  },
];

export const FALLBACK_HERO_IMAGE =
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/hero.jpg";

export const FALLBACK_PROJECT_IMAGES = [
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-main.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-2.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-3.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-4.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-5.jpg",
];

export const FALLBACK_PROCESS_ICONS = [
  "/library/process/process-step-1.svg",
  "/library/process/process-step-2.svg",
  "/library/process/process-step-3.svg",
  "/library/process/process-step-4.svg",
];

export function toBlockArray(value: unknown): HomeBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is HomeBlock => Boolean(item) && typeof item === "object");
}

export function toDict(value: unknown): Dict {
  return value && typeof value === "object" ? (value as Dict) : {};
}

export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function resolveTemplateName(block: HomeBlock): string {
  if (typeof block._template === "string" && block._template.length > 0) {
    return block._template;
  }

  if (typeof block.__typename === "string") {
    return TYPE_TO_TEMPLATE[block.__typename] || "";
  }

  return "";
}

export function getBlock(blocks: HomeBlock[], template: string): Dict {
  return toDict(blocks.find((block) => resolveTemplateName(block) === template));
}

export function mapProducts(list: HomeBlock[]): ProductItem[] {
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

export function mapServices(list: HomeBlock[]): ServiceItem[] {
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

export function mapFeatures(list: HomeBlock[]): FeatureItem[] {
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

export function mapStats(list: HomeBlock[]): StatItem[] {
  return list
    .map((item) => {
      const raw = toDict(item);
      return { raw, value: text(raw.value), label: text(raw.label) };
    })
    .filter((item) => item.value.length > 0 || item.label.length > 0);
}

export function mapPartnerLogos(value: unknown): PartnerLogoItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return { src: item, alt: "Partner logo" };
      }

      const raw = toDict(item);
      return {
        raw,
        src: text(raw.logo),
        alt: text(raw.alt, "Partner logo"),
        href: text(raw.href) || undefined,
      };
    })
    .filter((item) => item.src.length > 0);
}

export function mapSteps(list: HomeBlock[]): ProcessItem[] {
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

export function mapFaqTabs(list: HomeBlock[]): FaqTab[] {
  const tabs = list
    .map((tab) => {
      const rawTab = toDict(tab);
      return {
        raw: rawTab,
        label: text(rawTab.label),
        faqs: toBlockArray(rawTab.faqs)
          .map((faq) => {
            const rawFaq = toDict(faq);
            return {
              raw: rawFaq,
              question: text(rawFaq.question),
              answer: text(rawFaq.answer),
            };
          })
          .filter((faq) => faq.question.length > 0),
      };
    })
    .filter((tab) => tab.label.length > 0);

  return tabs.length > 0 ? tabs : FALLBACK_FAQ_TABS;
}
