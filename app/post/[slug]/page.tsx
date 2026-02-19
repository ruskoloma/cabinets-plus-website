import type { Metadata } from "next";
import { client } from "@/tina/__generated__/client";
import PostClient from "./post-client";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const result = await client.queries.post({ relativePath: `${slug}.md` });
  const { title, seo, excerpt } = result.data.post;
  return {
    title: seo?.title || title,
    description: seo?.description || excerpt || undefined,
    openGraph: {
      title: seo?.title || title,
      description: seo?.description || excerpt || undefined,
      ...(seo?.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await client.queries.post({ relativePath: `${slug}.md` });
  return <PostClient {...result} />;
}
