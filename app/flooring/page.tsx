import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import FlooringOverviewClient from "./flooring-overview-client";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("flooring-overview.md");
  const built = buildDocumentMetadata(result.data.page);
  return {
    title: built.title || "Flooring",
    description:
      built.description ||
      "Hardwood, luxury vinyl plank, tile, and laminate flooring at Cabinets Plus in Spokane. Visit our showroom to compare styles and plan your project.",
    openGraph: built.openGraph,
  };
}

export default async function FlooringPage() {
  const result = await getPageDataSafe("flooring-overview.md");
  return <FlooringOverviewClient {...result} />;
}
