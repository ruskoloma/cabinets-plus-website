import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import { extractRelatedPostNodes, getRelatedPostsSafe } from "@/app/get-related-posts-safe";
import { getCabinetRefinishingMainPageSettingsSafe } from "@/app/get-cabinet-refinishing-main-page-settings-safe";
import CabinetRefinishingOverviewClient from "./cabinet-refinishing-overview-client";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getCabinetRefinishingMainPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.cabinetRefinishingMainPageSettings);
  return {
    title: built.title || "Cabinet Refinishing",
    description:
      built.description ||
      "Refresh your kitchen without the cost of replacement. Cabinets Plus offers cabinet refinishing, painting, refacing, and wood tone changes in Spokane & Spokane Valley.",
    alternates: { canonical: "/cabinet-refinishing" },
    openGraph: built.openGraph,
  };
}

export default async function CabinetRefinishingPage() {
  const [result, postsResult] = await Promise.all([
    getCabinetRefinishingMainPageSettingsSafe(),
    getRelatedPostsSafe(),
  ]);

  return <CabinetRefinishingOverviewClient {...result} posts={extractRelatedPostNodes(postsResult.data)} />;
}
