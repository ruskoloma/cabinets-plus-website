import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import FlooringOverviewClient from "./flooring-overview-client";
import { getFlooringMainPageSettingsSafe } from "@/app/get-flooring-main-page-settings-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getFlooringMainPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.flooringMainPageSettings);
  return {
    title: built.title || "Flooring",
    description:
      built.description ||
      "Hardwood, luxury vinyl plank, tile, and laminate flooring at Cabinets Plus in Spokane. Visit our showroom to compare styles and plan your project.",
    openGraph: built.openGraph,
  };
}

export default async function FlooringPage() {
  const result = await getFlooringMainPageSettingsSafe();
  return <FlooringOverviewClient {...result} />;
}
