import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import KitchenRemodelOverviewClient from "./kitchen-remodel-overview-client";
import { getKitchenRemodelMainPageSettingsSafe } from "@/app/get-kitchen-remodel-main-page-settings-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getKitchenRemodelMainPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.kitchenRemodelMainPageSettings);
  return {
    title: built.title || "Kitchen Remodel",
    description:
      built.description ||
      "Plan your Spokane kitchen remodel at Cabinets Plus — full range of cabinets, countertops, and flooring with in-house design help and cabinet & countertop installation.",
    openGraph: built.openGraph,
  };
}

export default async function KitchenRemodelPage() {
  const result = await getKitchenRemodelMainPageSettingsSafe();
  return <KitchenRemodelOverviewClient {...result} />;
}
