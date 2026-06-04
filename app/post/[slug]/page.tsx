import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostDataSafe, getPostIndexSafe } from "@/app/get-post-data-safe";
import { getPostPageSettingsSafe } from "@/app/get-post-page-settings-safe";
import { client } from "@/tina/__generated__/client";
import PostClient from "./post-client";

export async function generateStaticParams() {
  const index = await getPostIndexSafe();
  return index.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPostDataSafe(slug);
  const post = result.data.post;
  if (!post) return {};

  const { title, seo, subtitle } = post;
  const description = seo?.description || subtitle || undefined;
  return {
    title: seo?.title || title,
    description,
    alternates: { canonical: `/post/${slug}` },
    openGraph: {
      title: seo?.title || title,
      description,
      ...(seo?.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, postsData, pageSettingsData] = await Promise.all([
    getPostDataSafe(slug),
    client.queries.postConnection({ first: 100 }),
    getPostPageSettingsSafe(),
  ]);

  if (!result.data.post) {
    notFound();
  }

  return <PostClient {...result} pageSettingsData={pageSettingsData} postsData={postsData} />;
}
