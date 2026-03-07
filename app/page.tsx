import type { Metadata } from "next";
import HomeClient from "./home-client";
import { getPageDataSafe } from "./get-page-data-safe";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPageDataSafe("home.md");
  const page = result.data.page;
  if (!page) return {};
  const { title, seo } = page;
  return {
    title: seo?.title || title,
    description: seo?.description || undefined,
    openGraph: seo?.ogImage ? { images: [{ url: seo.ogImage }] } : undefined,
  };
}

export default async function Home() {
  const result = await getPageDataSafe("home.md");
  return <HomeClient {...result} />;
}
