import type { Metadata } from "next";
import { Suspense } from "react";
import GalleryOverviewClient from "./gallery-overview-client";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getGalleryPageSettingsSafe } from "@/app/get-gallery-page-settings-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getGalleryPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.galleryPageSettings);
  return {
    title: built.title || "Gallery",
    description:
      built.description ||
      "Browse completed cabinet, bath, laundry, and interior projects from Cabinets Plus.",
    openGraph: built.openGraph,
  };
}

export default async function GalleryPage() {
  const [overviewData, pageSettingsData] = await Promise.all([
    getGalleryOverviewDataSafe(),
    getGalleryPageSettingsSafe(),
  ]);

  return (
    <Suspense fallback={null}>
      <GalleryOverviewClient overviewData={overviewData} pageSettingsData={pageSettingsData} />
    </Suspense>
  );
}
