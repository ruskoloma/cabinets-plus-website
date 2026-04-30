import {
  createStaticQueryResult,
  readJsonContentFile,
  readMarkdownFrontmatter,
} from "@/app/lib/content";
import { enrichProjectsSectionBlocksInPageResult } from "@/app/lib/enrich-projects-section";
import { PAGE_QUERY } from "@/components/page-settings/queries";
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
  articleContentSection: "PageBlocksArticleContentSection",
  magazineEmbed: "PageBlocksMagazineEmbed",
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

function normalizePageRelativePath(relativePath: string): string {
  return relativePath.replace(/\.md$/i, ".json");
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
  const normalizedRelativePath = normalizePageRelativePath(relativePath);

  try {
    const result = await client.request(
      {
        query: PAGE_QUERY,
        variables: { relativePath: normalizedRelativePath },
      },
      {},
    );
    const payload = {
      data: (result as { data?: { page?: PageData | null } }).data || {},
      query: PAGE_QUERY,
      variables: { relativePath: normalizedRelativePath },
    };
    await enrichProjectsSectionBlocksInPageResult(payload);
    return payload;
  } catch (error) {
    try {
      const document = await readJsonContentFile<PageData>(
        "global",
        normalizedRelativePath,
      );
      const fallback = {
        ...createStaticQueryResult({
          page: normalizePageData(document),
        }),
        query: PAGE_QUERY,
        variables: { relativePath: normalizedRelativePath },
      };
      await enrichProjectsSectionBlocksInPageResult(fallback);
      return fallback;
    } catch {
      try {
        const frontmatter = await readMarkdownFrontmatter("pages", relativePath);
        const fallback = {
          ...createStaticQueryResult({
            page: normalizePageData(frontmatter),
          }),
          query: PAGE_QUERY,
          variables: { relativePath: normalizedRelativePath },
        };
        await enrichProjectsSectionBlocksInPageResult(fallback);
        return fallback;
      } catch {
        console.error(`Unable to load page "${normalizedRelativePath}" from Tina or local file.`, error);
        return {
          ...createStaticQueryResult({ page: null }),
          query: PAGE_QUERY,
          variables: { relativePath: normalizedRelativePath },
        };
      }
    }
  }
}
