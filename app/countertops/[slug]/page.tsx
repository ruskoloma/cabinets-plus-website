import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CountertopDetailClient from "./countertop-client";
import { getCountertopDataSafe, getCountertopIndexSafe } from "@/app/get-countertop-data-safe";
import { getCountertopPageSettingsSafe } from "@/app/get-countertop-page-settings-safe";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export async function generateStaticParams() {
  const countertopIndex = await getCountertopIndexSafe();
  return countertopIndex.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCountertopDataSafe(slug);
  const countertop = result.data.countertop;

  if (!countertop) return {};

  const name = countertop.name || slug;
  const code = countertop.code?.trim() ? ` (#${countertop.code.trim().replace(/^#+/, "")})` : "";

  return {
    title: `${name}${code}`,
    description: countertop.description || undefined,
    openGraph: countertop.picture ? { images: [{ url: countertop.picture }] } : undefined,
  };
}

export default async function CountertopDetailRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [result, countertopIndex, homePageData, pageSettingsData, galleryOverviewData] = await Promise.all([
    getCountertopDataSafe(slug),
    getCountertopIndexSafe(),
    getPageDataSafe("home.md"),
    getCountertopPageSettingsSafe(),
    getGalleryOverviewDataSafe(),
  ]);

  if (!result.data.countertop) {
    notFound();
  }

  return (
    <CountertopDetailClient
      countertopIndex={countertopIndex}
      currentSlug={slug}
      data={result.data}
      galleryOverviewData={galleryOverviewData}
      homePageData={homePageData}
      pageSettingsData={pageSettingsData}
      query={result.query}
      variables={result.variables}
    />
  );
}
