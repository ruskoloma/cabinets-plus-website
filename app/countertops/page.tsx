import type { Metadata } from "next";
import { Suspense } from "react";
import CountertopsOverviewClient from "./countertops-overview-client";
import { getCountertopsOverviewDataSafe } from "@/app/get-countertops-overview-data-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export const metadata: Metadata = {
  title: "Countertops",
  description: "Browse quartz, granite, marble, and other countertop materials in our full countertop catalog.",
};

export default async function CountertopsPage() {
  const [overviewData, homePageData] = await Promise.all([
    getCountertopsOverviewDataSafe(),
    getPageDataSafe("home.md"),
  ]);

  return (
    <Suspense fallback={null}>
      <CountertopsOverviewClient
        homePageData={homePageData}
        overviewData={overviewData}
      />
    </Suspense>
  );
}
