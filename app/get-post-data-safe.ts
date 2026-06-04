import { createStaticQueryResult, listMarkdownFiles } from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import type { PostQuery, PostQueryVariables } from "@/tina/__generated__/types";

export interface PostQueryLikeResult {
  data: PostQuery;
  query: string;
  variables: PostQueryVariables;
}

function toSlug(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/\s+/g, "-");
}

// Resolve a single post by slug. A missing slug must NOT crash the route:
// Tina throws "Unable to find record content/posts/<slug>.md" for retired
// posts, so we catch it and return a null post for the caller to notFound().
export async function getPostDataSafe(slug: string): Promise<PostQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    return (await client.queries.post({ relativePath })) as PostQueryLikeResult;
  } catch {
    return createStaticQueryResult({ post: null }) as unknown as PostQueryLikeResult;
  }
}

export async function getPostIndexSafe(): Promise<Array<{ slug: string }>> {
  try {
    const files = await listMarkdownFiles("posts");
    return files.map((filename) => ({ slug: toSlug(filename) }));
  } catch (error) {
    console.error("Unable to read post index from local files.", error);
    return [];
  }
}
