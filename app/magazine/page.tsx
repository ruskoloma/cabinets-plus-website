import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import MagazinePageClient from "./magazine-page-client";
import { getPageDataSafe } from "../get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("magazine.md");
  return buildDocumentMetadata(result.data.page);
}

export default async function MagazinePage() {
  const result = await getPageDataSafe("magazine.md");
  return <MagazinePageClient {...result} />;
}
