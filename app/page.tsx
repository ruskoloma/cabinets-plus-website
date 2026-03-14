import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import HomeClient from "./home-client";
import { getPageDataSafe } from "./get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("home.md");
  return buildDocumentMetadata(result.data.page);
}

export default async function Home() {
  const result = await getPageDataSafe("home.md");
  return <HomeClient {...result} />;
}
