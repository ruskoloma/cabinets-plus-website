import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import { getPageDataSafe } from "@/app/get-page-data-safe";
import PrivacyPolicyClient from "./privacy-policy-client";

const RELATIVE_PATH = "privacy-policy.json";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe(RELATIVE_PATH);
  return { ...buildDocumentMetadata(result.data.page), alternates: { canonical: "/privacy-policy" } };
}

export default async function PrivacyPolicyPage() {
  const result = await getPageDataSafe(RELATIVE_PATH);
  return <PrivacyPolicyClient {...result} />;
}
