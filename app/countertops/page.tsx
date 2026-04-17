import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import CountertopsOverviewClient from "./countertops-overview-client";
import { getPageDataSafe } from "@/app/get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("countertops-overview.md");
  const built = buildDocumentMetadata(result.data.page);
  return {
    title: built.title || "Countertops",
    description:
      built.description ||
      "Explore quartz, granite, marble and quartzite countertops at Cabinets Plus in Spokane. In-house fabrication, free measurements and professional installation.",
    openGraph: built.openGraph,
  };
}

export default async function CountertopsPage() {
  const result = await getPageDataSafe("countertops-overview.md");
  return <CountertopsOverviewClient {...result} />;
}
