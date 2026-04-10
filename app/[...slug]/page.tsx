import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import PageClient from "@/app/page-client";
import {
  getPageBySlugSafe,
  getAllPageSlugs,
} from "@/app/get-page-by-slug-safe";
import { getSharedSectionsSafe } from "@/app/get-shared-sections-safe";

export async function generateStaticParams() {
  return getAllPageSlugs().map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const joined = slug.join("/");
  const result = await getPageBySlugSafe(joined);
  if (!result?.data.page) return {};
  return buildDocumentMetadata(result.data.page);
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const joined = slug.join("/");

  const [result, sharedSections] = await Promise.all([
    getPageBySlugSafe(joined),
    getSharedSectionsSafe(),
  ]);

  if (!result?.data.page) notFound();

  return <PageClient {...result} sharedSections={sharedSections} />;
}
