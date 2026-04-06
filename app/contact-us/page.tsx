import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import ContactPageClient from "./contact-page-client";
import { getPageDataSafe } from "../get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("contact-us.md");
  return buildDocumentMetadata(result.data.page);
}

export default async function ContactPage() {
  const result = await getPageDataSafe("contact-us.md");
  return <ContactPageClient {...result} />;
}
