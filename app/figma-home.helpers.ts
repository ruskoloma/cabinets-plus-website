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

const SHARED_PAGE_TYPENAME_TO_TEMPLATE: Record<string, string> = {
  Hero: "hero",
  ProductsSection: "productsSection",
  ServicesSection: "servicesSection",
  ProjectsSection: "projectsSection",
  WhyUsSection: "whyUsSection",
  AboutSection: "aboutSection",
  ShowroomBanner: "showroomBanner",
  ProcessSection: "processSection",
  FaqSection: "faqSection",
  MiniFaqSection: "miniFaqSection",
  ContactSection: "contactSection",
  ShowroomSection: "showroomSection",
  TrustStrip: "trustStrip",
  AboutStorySection: "aboutStorySection",
  RichContent: "richContent",
  MagazineEmbed: "magazineEmbed",
  PartnersSection: "partnersSection",
  CountertopPartnersSection: "countertopPartnersSection",
  FlooringPartnersSection: "flooringPartnersSection",
  RelatedArticlesSection: "relatedArticlesSection",
  TextImageSection: "textImageSection",
  SharedContactSection: "sharedContactSection",
  SharedShowroomSection: "sharedShowroomSection",
  SharedAboutSection: "sharedAboutSection",
  SharedPartnersSection: "sharedPartnersSection",
  SharedCountertopPartnersSection: "sharedCountertopPartnersSection",
  SharedFlooringPartnersSection: "sharedFlooringPartnersSection",
};

function buildTypenameMap(prefix: string, entries: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries).map(([suffix, template]) => [`${prefix}${suffix}`, template]),
  );
}

const TYPE_TO_TEMPLATE: Record<string, string> = {
  ...buildTypenameMap("PageBlocks", SHARED_PAGE_TYPENAME_TO_TEMPLATE),
  ...buildTypenameMap("ServiceBlocks", {
    Hero: "hero",
    Features: "features",
    Gallery: "gallery",
    CtaBanner: "ctaBanner",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsCabinetBlocks", {
    CabinetProductInfo: "cabinetProductInfo",
    ProjectsUsingThisProduct: "projectsUsingThisProduct",
    RelatedProducts: "relatedProducts",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsCountertopBlocks", {
    CountertopProductInfo: "countertopProductInfo",
    ProjectsUsingThisProduct: "projectsUsingThisProduct",
    RelatedProducts: "relatedProducts",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsFlooringBlocks", {
    FlooringProductInfo: "flooringProductInfo",
    ProjectsUsingThisProduct: "projectsUsingThisProduct",
    RelatedProducts: "relatedProducts",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsProjectBlocks", {
    ProjectInfo: "projectInfo",
    ProjectMaterials: "projectMaterials",
    ProjectRelatedProjects: "projectRelatedProjects",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsCabinetsMainPageBlocks", SHARED_PAGE_TYPENAME_TO_TEMPLATE),
  ...buildTypenameMap("PageSettingsCountertopsMainPageBlocks", SHARED_PAGE_TYPENAME_TO_TEMPLATE),
  ...buildTypenameMap("PageSettingsFlooringMainPageBlocks", SHARED_PAGE_TYPENAME_TO_TEMPLATE),
  ...buildTypenameMap("PageSettingsKitchenRemodelMainPageBlocks", SHARED_PAGE_TYPENAME_TO_TEMPLATE),
  ...buildTypenameMap("PageSettingsBathroomRemodelMainPageBlocks", SHARED_PAGE_TYPENAME_TO_TEMPLATE),
  ...buildTypenameMap("PageSettingsCabinetsOverviewBlocks", {
    CabinetCatalogGrid: "cabinetCatalogGrid",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsCountertopsOverviewBlocks", {
    CountertopCatalogGrid: "countertopCatalogGrid",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsFlooringOverviewBlocks", {
    FlooringCatalogGrid: "flooringCatalogGrid",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsGalleryBlocks", {
    GalleryProjectGrid: "galleryProjectGrid",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsBlogBlocks", {
    BlogPostsGrid: "blogPostsGrid",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
  ...buildTypenameMap("PageSettingsPostBlocks", {
    PostContent: "postContent",
    PostRelatedArticles: "postRelatedArticles",
    ...SHARED_PAGE_TYPENAME_TO_TEMPLATE,
  }),
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

export interface ResolvedProjectItem {
  href: string;
  image: string;
  title: string;
  imageOverride?: string;
  projectFilename?: string;
}

function projectFilenameFromReference(project: unknown): string {
  if (typeof project === "string") {
    const name = project.split("/").pop() || "";
    return name.replace(/\.md$/, "");
  }
  if (project && typeof project === "object") {
    const record = project as Record<string, unknown>;
    const sys = record._sys as Record<string, unknown> | undefined;
    const filename = typeof sys?.filename === "string" ? sys.filename : "";
    if (filename) return filename.replace(/\.md$/, "");
    const relativePath = typeof sys?.relativePath === "string" ? sys.relativePath : "";
    if (relativePath) {
      const name = relativePath.split("/").pop() || "";
      return name.replace(/\.md$/, "");
    }
  }
  return "";
}

function firstMediaFile(project: unknown): string {
  if (!project || typeof project !== "object") return "";
  const mediaList = (project as Record<string, unknown>).media;
  if (!Array.isArray(mediaList) || mediaList.length === 0) return "";
  const first = mediaList[0];
  if (!first || typeof first !== "object") return "";
  const file = (first as Record<string, unknown>).file;
  return typeof file === "string" ? file : "";
}

export function mapResolvedProjects(value: unknown): ResolvedProjectItem[] {
  if (!Array.isArray(value)) return [];

  const items: ResolvedProjectItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;

    if (typeof item.href === "string" || typeof item.image === "string") {
      const href = text(item.href);
      const image = text(item.image);
      if (!href && !image) continue;

      items.push({
        href,
        image,
        title: text(item.title),
        imageOverride: text(item.imageOverride) || undefined,
        projectFilename: text(item.projectFilename) || undefined,
      });
      continue;
    }

    const filename = projectFilenameFromReference(item.project);
    if (!filename) continue;

    const projectRecord = item.project && typeof item.project === "object" ? (item.project as Record<string, unknown>) : null;
    const override = text(item.imageOverride);
    const image = override.length > 0 ? override : firstMediaFile(projectRecord);
    const title = projectRecord && typeof projectRecord.title === "string" && projectRecord.title.length > 0
      ? projectRecord.title
      : filename;

    items.push({
      href: `/projects/${filename}`,
      image,
      title,
      imageOverride: override.length > 0 ? override : undefined,
      projectFilename: filename,
    });
  }
  return items;
}

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
