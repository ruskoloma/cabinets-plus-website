import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CollectionClient from "./collection-client";
import { getCollectionDataSafe, getCollectionIndexSafe } from "@/app/get-collection-data-safe";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getCollectionPageSettingsSafe } from "@/app/get-collection-page-settings-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";
import { buildCollectionGallery, getCollectionHeading } from "@/components/special/collection-detail/helpers";

export async function generateStaticParams() {
  const collectionIndex = await getCollectionIndexSafe();
  return collectionIndex.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionDataSafe(slug);
  const collection = result.data.collection;

  if (!collection) return {};

  const defaultImage =
    collection.coverImage?.trim() ||
    buildCollectionGallery(collection)[0]?.file;

  return {
    title: collection.title || getCollectionHeading(collection, slug),
    description: collection.description || undefined,
    openGraph: defaultImage ? { images: [{ url: defaultImage }] } : undefined,
  };
}

export default async function CollectionDetailRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [collectionData, overviewData, homePageData, pageSettingsData] = await Promise.all([
    getCollectionDataSafe(slug),
    getGalleryOverviewDataSafe(),
    getPageDataSafe("home.md"),
    getCollectionPageSettingsSafe(),
  ]);

  if (!collectionData.data.collection) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <CollectionClient
        collectionData={collectionData}
        currentSlug={slug}
        homePageData={homePageData}
        overviewData={overviewData}
        pageSettingsData={pageSettingsData}
      />
    </Suspense>
  );
}
