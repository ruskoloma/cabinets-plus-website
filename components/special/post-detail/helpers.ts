import type { PostConnectionNode, PostDocument } from "./types";

export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function getPostSlug(post: { _sys?: { filename?: string | null } } | null | undefined) {
  return post?._sys?.filename?.trim() || "";
}

export function normalizePostReference(reference: string) {
  return reference
    .trim()
    .replace(/^\/+/, "")
    .replace(/^content\/posts\//i, "")
    .replace(/^posts\//i, "")
    .replace(/\.md$/i, "");
}

export function getSortedPosts(posts: PostConnectionNode[]) {
  return [...posts].sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : 0;
    const rightTime = right.date ? new Date(right.date).getTime() : 0;

    if (leftTime !== rightTime) return rightTime - leftTime;

    return text(left.title).localeCompare(text(right.title));
  });
}

export interface RelatedArticleCard {
  post: PostConnectionNode;
  selectionField?: string;
}

export function buildRelatedCards({
  post,
  sortedPosts,
  resolveSelectionField,
  limit = 3,
}: {
  post: PostDocument;
  sortedPosts: PostConnectionNode[];
  resolveSelectionField: (index: number) => string | undefined;
  limit?: number;
}): RelatedArticleCard[] {
  const bySlug = new Map(sortedPosts.map((item) => [getPostSlug(item), item] as const));
  const explicitRelated = post.relatedArticles || [];
  const cards: RelatedArticleCard[] = [];
  const seen = new Set<string>([getPostSlug(post)]);

  explicitRelated.forEach((entry, index) => {
    const slug = normalizePostReference(text(entry?.post));
    if (!slug || seen.has(slug)) return;

    const relatedPost = bySlug.get(slug);
    if (!relatedPost) return;

    seen.add(slug);
    cards.push({
      post: relatedPost,
      selectionField: resolveSelectionField(index),
    });
  });

  for (const candidate of sortedPosts) {
    if (cards.length >= limit) break;

    const slug = getPostSlug(candidate);
    if (!slug || seen.has(slug)) continue;

    seen.add(slug);
    cards.push({ post: candidate });
  }

  return cards;
}

export function findAdjacentPosts(sortedPosts: PostConnectionNode[], currentSlug: string) {
  const currentIndex = sortedPosts.findIndex((item) => getPostSlug(item) === currentSlug);
  return {
    previousPost: currentIndex > 0 ? sortedPosts[currentIndex - 1] : null,
    nextPost:
      currentIndex >= 0 && currentIndex < sortedPosts.length - 1
        ? sortedPosts[currentIndex + 1]
        : null,
  };
}
