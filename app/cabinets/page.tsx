import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import CabinetsOverviewClient from "./cabinets-overview-client";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("cabinets-overview.md");
  const built = buildDocumentMetadata(result.data.page);
  return {
    title: built.title || "Cabinets",
    description:
      built.description ||
      "Browse cabinet styles, finishes, and services at Cabinets Plus in Spokane. Semi-custom cabinetry, in-house design consultation, and professional installation.",
    openGraph: built.openGraph,
  };
}

export default async function CabinetsPage() {
  const result = await getPageDataSafe("cabinets-overview.md");
  return <CabinetsOverviewClient {...result} />;
}
