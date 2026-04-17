import type { Metadata } from "next";
import { Suspense } from "react";
import FlooringOverviewClient from "./flooring-overview-client";
import { getFlooringOverviewDataSafe } from "@/app/get-flooring-overview-data-safe";
import { getFlooringOverviewPageSettingsSafe } from "@/app/get-flooring-overview-page-settings-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export const metadata: Metadata = {
  title: "Flooring Catalog",
  description: "Browse LVP, laminate, carpet, and hardwood products in our full flooring catalog.",
};

export default async function FlooringCatalogPage() {
  const [overviewData, homePageData, pageSettingsData] = await Promise.all([
    getFlooringOverviewDataSafe(),
    getPageDataSafe("home.md"),
    getFlooringOverviewPageSettingsSafe(),
  ]);

  return (
    <Suspense fallback={null}>
      <FlooringOverviewClient
        homePageData={homePageData}
        overviewData={overviewData}
        pageSettingsData={pageSettingsData}
      />
    </Suspense>
  );
}
