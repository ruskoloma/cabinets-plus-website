import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import BathroomRemodelOverviewClient from "./bathroom-remodel-overview-client";
import { getBathroomRemodelMainPageSettingsSafe } from "@/app/get-bathroom-remodel-main-page-settings-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getBathroomRemodelMainPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.bathroomRemodelMainPageSettings);
  return {
    title: built.title || "Bathroom Remodel",
    description:
      built.description ||
      "Bathroom remodel materials and installation in Spokane — vanities, countertops, flooring, and shower glass at our Sprague Avenue showroom. We work with homeowners and contractors.",
    openGraph: built.openGraph,
  };
}

export default async function BathroomRemodelPage() {
  const result = await getBathroomRemodelMainPageSettingsSafe();
  return <BathroomRemodelOverviewClient {...result} />;
}
