import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import CabinetsOverviewClient from "./cabinets-overview-client";
import { getCabinetsMainPageSettingsSafe } from "@/app/get-cabinets-main-page-settings-safe";
import { extractRelatedPostNodes, getRelatedPostsSafe } from "@/app/get-related-posts-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getCabinetsMainPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.cabinetsMainPageSettings);
  return {
    title: built.title || "Cabinets",
    description:
      built.description ||
      "Browse cabinet styles, finishes, and services at Cabinets Plus in Spokane. Semi-custom cabinetry, in-house design consultation, and professional installation.",
    openGraph: built.openGraph,
  };
}

export default async function CabinetsPage() {
  const [result, postsResult] = await Promise.all([
    getCabinetsMainPageSettingsSafe(),
    getRelatedPostsSafe(),
  ]);
  return <CabinetsOverviewClient {...result} posts={extractRelatedPostNodes(postsResult.data)} />;
}
