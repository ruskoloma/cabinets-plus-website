import type { Metadata } from "next";
import { Suspense } from "react";
import GalleryOverviewClient from "./gallery-overview-client";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse completed cabinet, bath, laundry, and interior projects from Cabinets Plus.",
};

export default async function GalleryPage() {
  const [overviewData, homePageData] = await Promise.all([
    getGalleryOverviewDataSafe(),
    getPageDataSafe("home.md"),
  ]);

  return (
    <Suspense fallback={null}>
      <GalleryOverviewClient homePageData={homePageData} overviewData={overviewData} />
    </Suspense>
  );
}
