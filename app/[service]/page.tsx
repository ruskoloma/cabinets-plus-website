import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { client } from "@/tina/__generated__/client";
import ServicePageClient from "./service-client";

const SERVICE_SLUGS = ["countertops", "flooring", "bathroom-remodel"];

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

interface ServiceQueryLikeResult {
  data: { service?: ServiceData | null };
  query?: string;
  variables?: Record<string, unknown>;
}

const SERVICE_TEMPLATE_TYPENAMES: Record<string, string> = {
  hero: "ServiceBlocksHero",
  features: "ServiceBlocksFeatures",
  gallery: "ServiceBlocksGallery",
  ctaBanner: "ServiceBlocksCtaBanner",
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
      ? data.blocks.map((block) => normalizeServiceBlock(block)).filter((block): block is Record<string, unknown> => Boolean(block))
      : [],
  };
}

async function getServiceDataSafe(slug: string): Promise<ServiceQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    const result = await client.queries.service({ relativePath });
    return result;
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "content", "services", relativePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const normalized = normalizeServiceData(parsed.data);

      return {
        data: { service: normalized },
        query: "",
        variables: {},
      };
    } catch {
      console.error(`Unable to load service "${slug}" from Tina or local file.`, error);
      return {
        data: { service: null },
        query: "",
        variables: {},
      };
    }
  }
}

export async function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ service: slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ service: string }> }
): Promise<Metadata> {
  const { service } = await params;
  const result = await getServiceDataSafe(service);
  const serviceData = result.data.service;
  if (!serviceData) return {};

  const { title, seo } = serviceData;
  return {
    title: seo?.title || title,
    description: seo?.description || undefined,
    openGraph: seo?.ogImage ? { images: [{ url: seo.ogImage }] } : undefined,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const result = await getServiceDataSafe(service);
  if (!result.data.service) notFound();

  return <ServicePageClient {...result} />;
}
