import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import PageClient from "./page-client";
import { getPageDataSafe } from "./get-page-data-safe";
import { getSharedSectionsSafe } from "./get-shared-sections-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("home.md");
  return buildDocumentMetadata(result.data.page);
}

export default async function Home() {
  const [result, sharedSections] = await Promise.all([
    getPageDataSafe("home.md"),
    getSharedSectionsSafe(),
  ]);

  return <PageClient {...result} sharedSections={sharedSections} />;
}
