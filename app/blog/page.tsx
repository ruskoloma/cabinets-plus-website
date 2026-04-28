import type { Metadata } from "next";
import { Suspense } from "react";
import BlogClient from "./blog-client";
import { buildDocumentMetadata } from "@/app/lib/metadata";
import { getBlogPageSettingsSafe } from "@/app/get-blog-page-settings-safe";
import { client } from "@/tina/__generated__/client";
import { BLOG_POSTS_QUERY } from "@/components/special/blog-overview/queries";
import type { BlogPostsQueryLikeResult } from "@/components/special/blog-overview/types";

async function getBlogPostsSafe(): Promise<BlogPostsQueryLikeResult> {
  try {
    const result = await client.request(
      {
        query: BLOG_POSTS_QUERY,
        variables: {},
      },
      {},
    );
    const data = (result as { data?: Record<string, unknown> }).data || {};
    return {
      data: data as BlogPostsQueryLikeResult["data"],
      query: BLOG_POSTS_QUERY,
      variables: {},
    };
  } catch (error) {
    console.error("Unable to load blog posts from Tina; rendering empty list.", error);
    return {
      data: { postConnection: { edges: [] } },
      query: BLOG_POSTS_QUERY,
      variables: {},
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await getBlogPageSettingsSafe();
  const built = buildDocumentMetadata(result.data.blogPageSettings);
  return {
    title: built.title || "Blog",
    description:
      built.description ||
      "Discover helpful insights for your home renovation journey from the Cabinets Plus team.",
    openGraph: built.openGraph,
  };
}

export default async function BlogPage() {
  const [postsData, pageSettingsData] = await Promise.all([
    getBlogPostsSafe(),
    getBlogPageSettingsSafe(),
  ]);

  return (
    <Suspense fallback={null}>
      <BlogClient pageSettingsData={pageSettingsData} postsData={postsData} />
    </Suspense>
  );
}
