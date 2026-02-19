import type { Metadata } from "next";
import { client } from "@/tina/__generated__/client";
import GenericPageClient from "../generic-page-client";

export async function generateMetadata(): Promise<Metadata> {
  const result = await client.queries.page({ relativePath: "contact-us.md" });
  const { title, seo } = result.data.page;
  return {
    title: seo?.title || title,
    description: seo?.description || undefined,
    openGraph: seo?.ogImage ? { images: [{ url: seo.ogImage }] } : undefined,
  };
}

export default async function ContactPage() {
  const result = await client.queries.page({ relativePath: "contact-us.md" });
  return <GenericPageClient {...result} />;
}
