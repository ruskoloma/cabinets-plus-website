import type { Metadata } from "next";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import GlassEnclosuresOverviewClient from "./glass-enclosures-overview-client";
import { getGlassEnclosuresMainPageSettingsSafe } from "@/app/get-glass-enclosures-main-page-settings-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getGlassEnclosuresMainPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.glassEnclosuresMainPageSettings);
  return {
    title: built.title || "Glass Enclosures",
    description:
      built.description ||
      "Custom shower glass, frameless shower doors, glass panels, and mirrors measured, fabricated, and installed by Cabinets Plus in Spokane.",
    openGraph: built.openGraph,
  };
}

export default async function GlassEnclosuresPage() {
  const result = await getGlassEnclosuresMainPageSettingsSafe();
  return <GlassEnclosuresOverviewClient {...result} />;
}
