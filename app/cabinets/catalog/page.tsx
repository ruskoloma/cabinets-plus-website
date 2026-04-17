import type { Metadata } from "next";
import { Suspense } from "react";
import CabinetsCatalogClient from "./cabinets-catalog-client";
import { getCabinetsOverviewDataSafe } from "@/app/get-cabinets-overview-data-safe";
import { getCabinetsOverviewPageSettingsSafe } from "@/app/get-cabinets-overview-page-settings-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export const metadata: Metadata = {
  title: "Cabinet Catalog",
  description: "Browse cabinet door styles, finishes, and product details in our full cabinet catalog.",
};

export default async function CabinetsCatalogPage() {
  const [overviewData, homePageData, pageSettingsData] = await Promise.all([
    getCabinetsOverviewDataSafe(),
    getPageDataSafe("home.md"),
    getCabinetsOverviewPageSettingsSafe(),
  ]);

  return (
    <Suspense fallback={null}>
      <CabinetsCatalogClient
        homePageData={homePageData}
        overviewData={overviewData}
        pageSettingsData={pageSettingsData}
      />
    </Suspense>
  );
}
