import { createStaticQueryResult, readMarkdownFrontmatter } from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";

export const SERVICE_SLUGS = ["countertops", "flooring", "bathroom-remodel"] as const;

interface ServiceSeo {
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
}

interface ServiceData {
  title?: string | null;
  seo?: ServiceSeo | null;
  blocks?: unknown[] | null;
}

export interface ServiceQueryLikeResult {
  data: { service?: ServiceData | null };
  query?: string;
  variables?: Record<string, unknown>;
}

const SERVICE_TEMPLATE_TYPENAMES: Record<string, string> = {
  hero: "ServiceBlocksHero",
  features: "ServiceBlocksFeatures",
  gallery: "ServiceBlocksGallery",
  ctaBanner: "ServiceBlocksCtaBanner",
  productsSection: "ServiceBlocksProductsSection",
  servicesSection: "ServiceBlocksServicesSection",
  projectsSection: "ServiceBlocksProjectsSection",
  whyUsSection: "ServiceBlocksWhyUsSection",
  aboutSection: "ServiceBlocksAboutSection",
  showroomBanner: "ServiceBlocksShowroomBanner",
  processSection: "ServiceBlocksProcessSection",
  faqSection: "ServiceBlocksFaqSection",
  contactSection: "ServiceBlocksContactSection",
  showroomSection: "ServiceBlocksShowroomSection",
  trustStrip: "ServiceBlocksTrustStrip",
  aboutStorySection: "ServiceBlocksAboutStorySection",
  richContent: "ServiceBlocksRichContent",
  partnersSection: "ServiceBlocksPartnersSection",
  countertopPartnersSection: "ServiceBlocksCountertopPartnersSection",
  flooringPartnersSection: "ServiceBlocksFlooringPartnersSection",
  textImageSection: "ServiceBlocksTextImageSection",
  sharedContactSection: "ServiceBlocksSharedContactSection",
  sharedShowroomSection: "ServiceBlocksSharedShowroomSection",
  sharedAboutSection: "ServiceBlocksSharedAboutSection",
  sharedPartnersSection: "ServiceBlocksSharedPartnersSection",
  sharedCountertopPartnersSection: "ServiceBlocksSharedCountertopPartnersSection",
  sharedFlooringPartnersSection: "ServiceBlocksSharedFlooringPartnersSection",
};

function normalizeServiceBlock(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const block = value as Record<string, unknown>;
  if (typeof block.__typename === "string") return block;

  const template = block._template;
  if (typeof template === "string") {
    const typename = SERVICE_TEMPLATE_TYPENAMES[template];
    if (typename) {
      return { ...block, __typename: typename };
    }
  }

  return block;
}

function normalizeServiceData(value: unknown): ServiceData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const seoValue =
    data.seo && typeof data.seo === "object"
      ? (data.seo as Record<string, unknown>)
      : undefined;

  return {
    title: typeof data.title === "string" ? data.title : undefined,
    seo: seoValue
      ? {
          title: typeof seoValue.title === "string" ? seoValue.title : undefined,
          description:
            typeof seoValue.description === "string" ? seoValue.description : undefined,
          ogImage: typeof seoValue.ogImage === "string" ? seoValue.ogImage : undefined,
        }
      : undefined,
    blocks: Array.isArray(data.blocks)
      ? data.blocks
          .map((block) => normalizeServiceBlock(block))
          .filter((block): block is Record<string, unknown> => Boolean(block))
      : [],
  };
}

export async function getServiceDataSafe(slug: string): Promise<ServiceQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    return await client.queries.service({ relativePath });
  } catch (error) {
    try {
      const frontmatter = await readMarkdownFrontmatter("services", relativePath);
      return createStaticQueryResult({
        service: normalizeServiceData(frontmatter),
      });
    } catch {
      console.error(`Unable to load service "${slug}" from Tina or local file.`, error);
      return createStaticQueryResult({ service: null });
    }
  }
}
