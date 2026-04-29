import { client } from "@/tina/__generated__/client";
import { BLOG_POSTS_QUERY } from "@/components/special/blog-overview/queries";
import type { BlogPostsQueryLikeResult } from "@/components/special/blog-overview/types";
import type { PostConnectionNode } from "@/components/special/post-detail/types";

export async function getRelatedPostsSafe(): Promise<BlogPostsQueryLikeResult> {
  try {
    const result = await client.request({ query: BLOG_POSTS_QUERY, variables: {} }, {});
    const data = (result as { data?: Record<string, unknown> }).data || {};
    return {
      data: data as BlogPostsQueryLikeResult["data"],
      query: BLOG_POSTS_QUERY,
      variables: {},
    };
  } catch (error) {
    console.error("Unable to load posts for related-articles section.", error);
    return {
      data: { postConnection: { edges: [] } },
      query: BLOG_POSTS_QUERY,
      variables: {},
    };
  }
}

export function extractRelatedPostNodes(
  data: BlogPostsQueryLikeResult["data"] | null | undefined,
): PostConnectionNode[] {
  const edges = data?.postConnection?.edges || [];
  return edges.flatMap((edge) => {
    const node = edge?.node;
    return node ? [node as unknown as PostConnectionNode] : [];
  });
}
