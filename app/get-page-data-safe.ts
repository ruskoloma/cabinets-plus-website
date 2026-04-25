import {
  createStaticQueryResult,
  readMarkdownFrontmatter,
} from "@/app/lib/content";
import { enrichProjectsSectionBlocksInPageResult } from "@/app/lib/enrich-projects-section";
import { client } from "@/tina/__generated__/client";

interface PageSeo {
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
}

interface PageData {
  title?: string | null;
  seo?: PageSeo | null;
  blocks?: unknown[] | null;
}

export interface PageQueryLikeResult {
  data: { page?: PageData | null };
  query?: string;
  variables?: Record<string, unknown>;
}

const PAGE_TEMPLATE_TYPENAMES: Record<string, string> = {
  hero: "PageBlocksHero",
  productsSection: "PageBlocksProductsSection",
  servicesSection: "PageBlocksServicesSection",
  projectsSection: "PageBlocksProjectsSection",
  whyUsSection: "PageBlocksWhyUsSection",
  aboutSection: "PageBlocksAboutSection",
  showroomBanner: "PageBlocksShowroomBanner",
  processSection: "PageBlocksProcessSection",
  faqSection: "PageBlocksFaqSection",
  contactSection: "PageBlocksContactSection",
  showroomSection: "PageBlocksShowroomSection",
  trustStrip: "PageBlocksTrustStrip",
  aboutStorySection: "PageBlocksAboutStorySection",
  richContent: "PageBlocksRichContent",
  partnersSection: "PageBlocksPartnersSection",
  countertopPartnersSection: "PageBlocksCountertopPartnersSection",
  flooringPartnersSection: "PageBlocksFlooringPartnersSection",
  textImageSection: "PageBlocksTextImageSection",
  sharedContactSection: "PageBlocksSharedContactSection",
  sharedShowroomSection: "PageBlocksSharedShowroomSection",
  sharedAboutSection: "PageBlocksSharedAboutSection",
  sharedPartnersSection: "PageBlocksSharedPartnersSection",
  sharedCountertopPartnersSection: "PageBlocksSharedCountertopPartnersSection",
  sharedFlooringPartnersSection: "PageBlocksSharedFlooringPartnersSection",
};

function normalizePageBlock(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const block = value as Record<string, unknown>;
  if (typeof block.__typename === "string") return block;

  const template = block._template;
  if (typeof template === "string") {
    const typename = PAGE_TEMPLATE_TYPENAMES[template];
    if (typename) return { ...block, __typename: typename };
  }

  return block;
}

function normalizePageData(value: unknown): PageData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const seoValue = data.seo && typeof data.seo === "object" ? (data.seo as Record<string, unknown>) : undefined;

  return {
    title: typeof data.title === "string" ? data.title : undefined,
    seo: seoValue
      ? {
          title: typeof seoValue.title === "string" ? seoValue.title : undefined,
          description: typeof seoValue.description === "string" ? seoValue.description : undefined,
          ogImage: typeof seoValue.ogImage === "string" ? seoValue.ogImage : undefined,
        }
      : undefined,
    blocks: Array.isArray(data.blocks)
      ? data.blocks.map((block) => normalizePageBlock(block)).filter((block): block is Record<string, unknown> => Boolean(block))
      : [],
  };
}

export async function getPageDataSafe(relativePath: string): Promise<PageQueryLikeResult> {
  try {
    const result = await client.queries.page({ relativePath });
    await enrichProjectsSectionBlocksInPageResult(result);
    return result;
  } catch (error) {
    try {
      const frontmatter = await readMarkdownFrontmatter("pages", relativePath);
      const fallback = createStaticQueryResult({
        page: normalizePageData(frontmatter),
      });
      await enrichProjectsSectionBlocksInPageResult(fallback);
      return fallback;
    } catch {
      console.error(`Unable to load page "${relativePath}" from Tina or local file.`, error);
      return createStaticQueryResult({ page: null });
    }
  }
}
