import type { Metadata } from "next";
import { getPostPageSettingsSafe } from "@/app/get-post-page-settings-safe";
import { client } from "@/tina/__generated__/client";
import PostClient from "./post-client";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const result = await client.queries.post({ relativePath: `${slug}.md` });
  const { title, seo, subtitle } = result.data.post;
  const description = seo?.description || subtitle || undefined;
  return {
    title: seo?.title || title,
    description,
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
    client.queries.post({ relativePath: `${slug}.md` }),
    client.queries.postConnection({ first: 100 }),
    getPostPageSettingsSafe(),
  ]);
  return <PostClient {...result} pageSettingsData={pageSettingsData} postsData={postsData} />;
}
