import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import ResourcesPageClient from "./resources-page-client";
import { getPageDataSafe } from "../get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("resources.md");
  return { ...buildDocumentMetadata(result.data.page), alternates: { canonical: "/resources" } };
}

export default async function ResourcesPage() {
  const result = await getPageDataSafe("resources.md");
  return <ResourcesPageClient {...result} />;
}
