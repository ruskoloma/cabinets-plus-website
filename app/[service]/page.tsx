import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import { getServiceDataSafe, SERVICE_SLUGS } from "@/app/get-service-data-safe";
import ServicePageClient from "./service-client";

export async function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ service: slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ service: string }> }
): Promise<Metadata> {
  const { service } = await params;
  const result = await getServiceDataSafe(service);
  return buildDocumentMetadata(result.data.service);
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const result = await getServiceDataSafe(service);
  if (!result.data.service) notFound();

  return <ServicePageClient {...result} />;
}
