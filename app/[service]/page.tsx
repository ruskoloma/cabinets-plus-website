import type { Metadata } from "next";
import { client } from "@/tina/__generated__/client";
import ServicePageClient from "./service-client";

const SERVICE_SLUGS = ["cabinets", "countertops", "flooring", "bathroom-remodel"];

export async function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ service: slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ service: string }> }
): Promise<Metadata> {
  const { service } = await params;
  const result = await client.queries.service({ relativePath: `${service}.md` });
  const { title, seo } = result.data.service;
  return {
    title: seo?.title || title,
    description: seo?.description || undefined,
    openGraph: seo?.ogImage ? { images: [{ url: seo.ogImage }] } : undefined,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const result = await client.queries.service({ relativePath: `${service}.md` });
  return <ServicePageClient {...result} />;
}
