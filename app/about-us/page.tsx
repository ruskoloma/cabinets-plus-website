import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import AboutPageClient from "./about-page-client";
import { getPageDataSafe } from "../get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("about-us.md");
  return { ...buildDocumentMetadata(result.data.page), alternates: { canonical: "/about-us" } };
}

export default async function AboutPage() {
  const result = await getPageDataSafe("about-us.md");
  return <AboutPageClient {...result} />;
}
