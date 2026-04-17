import type { Metadata } from "next";
import { Suspense } from "react";
import CountertopsCatalogClient from "./countertops-catalog-client";
import { getCountertopsOverviewDataSafe } from "@/app/get-countertops-overview-data-safe";
import { getCountertopsOverviewPageSettingsSafe } from "@/app/get-countertops-overview-page-settings-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export const metadata: Metadata = {
  title: "Countertop Catalog",
  description: "Browse quartz, granite, marble, and other countertop materials in our full countertop catalog.",
};

export default async function CountertopsCatalogPage() {
  const [overviewData, homePageData, pageSettingsData] = await Promise.all([
    getCountertopsOverviewDataSafe(),
    getPageDataSafe("home.md"),
    getCountertopsOverviewPageSettingsSafe(),
  ]);

  return (
    <Suspense fallback={null}>
      <CountertopsCatalogClient
        homePageData={homePageData}
        overviewData={overviewData}
        pageSettingsData={pageSettingsData}
      />
    </Suspense>
  );
}
