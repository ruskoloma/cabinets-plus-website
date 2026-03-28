import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CabinetDetailClient from "./cabinet-client";
import { getCabinetDataSafe, getCabinetIndexSafe } from "@/app/get-cabinet-data-safe";
import { getCabinetPageSettingsSafe } from "@/app/get-cabinet-page-settings-safe";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export async function generateStaticParams() {
  const cabinetIndex = await getCabinetIndexSafe();
  return cabinetIndex.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCabinetDataSafe(slug);
  const cabinet = result.data.cabinet;

  if (!cabinet) return {};

  const name = cabinet.name || slug;
  const code = cabinet.code?.trim() ? ` (#${cabinet.code.trim().replace(/^#+/, "")})` : "";

  return {
    title: `${name}${code}`,
    description: cabinet.description || undefined,
    openGraph: cabinet.picture ? { images: [{ url: cabinet.picture }] } : undefined,
  };
}

export default async function CabinetDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [result, cabinetIndex, homePageData, pageSettingsData, galleryOverviewData] = await Promise.all([
    getCabinetDataSafe(slug),
    getCabinetIndexSafe(),
    getPageDataSafe("home.md"),
    getCabinetPageSettingsSafe(),
    getGalleryOverviewDataSafe(),
  ]);

  if (!result.data.cabinet) {
    notFound();
  }

  return (
    <CabinetDetailClient
      cabinetIndex={cabinetIndex}
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
