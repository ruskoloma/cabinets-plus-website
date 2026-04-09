import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FlooringDetailClient from "./flooring-client";
import { getFlooringDataSafe, getFlooringIndexSafe } from "@/app/get-flooring-data-safe";
import { getFlooringPageSettingsSafe } from "@/app/get-flooring-page-settings-safe";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export async function generateStaticParams() {
  const flooringIndex = await getFlooringIndexSafe();
  return flooringIndex.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getFlooringDataSafe(slug);
  const flooring = result.data.flooring;

  if (!flooring) return {};

  const name = flooring.name || slug;
  const code = flooring.code?.trim() ? ` (#${flooring.code.trim().replace(/^#+/, "")})` : "";

  return {
    title: `${name}${code}`,
    description: flooring.description || undefined,
    openGraph: flooring.picture ? { images: [{ url: flooring.picture }] } : undefined,
  };
}

export default async function FlooringDetailRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [result, flooringIndex, homePageData, pageSettingsData, galleryOverviewData] = await Promise.all([
    getFlooringDataSafe(slug),
    getFlooringIndexSafe(),
    getPageDataSafe("home.md"),
    getFlooringPageSettingsSafe(),
    getGalleryOverviewDataSafe(),
  ]);

  if (!result.data.flooring) {
    notFound();
  }

  return (
    <FlooringDetailClient
      flooringIndex={flooringIndex}
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
