import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import { client } from "@/tina/__generated__/client";
import PrivacyPolicyClient from "./privacy-policy-client";

const RELATIVE_PATH = "privacy-policy.md";

export async function generateMetadata(): Promise<Metadata> {
  const result = await client.queries.page({ relativePath: RELATIVE_PATH });
  return buildDocumentMetadata(result.data.page);
}

export default async function PrivacyPolicyPage() {
  const result = await client.queries.page({ relativePath: RELATIVE_PATH });
  return <PrivacyPolicyClient {...result} />;
}
