"use client";

import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import RelatedArticlesSection from "@/components/sections/RelatedArticlesSection";
import { findAdjacentPosts, getPostSlug, getSortedPosts, text } from "./helpers";
import type { PostConnectionNode, PostDocument } from "./types";

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === "previous" ? "M14.5 5.5 8 12l6.5 6.5" : "m9.5 5.5 6.5 6.5-6.5 6.5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArticleNavigationLink({
  direction,
  href,
  label,
  title,
}: {
  direction: "previous" | "next";
  href?: string;
  label: string;
  title?: string;
}) {
  const content = (
    <>
      {direction === "previous" ? <ArrowIcon direction="previous" /> : null}
      <span className="text-[16px] font-semibold leading-[1.25]">{label}</span>
      {direction === "next" ? <ArrowIcon direction="next" /> : null}
    </>
  );

  if (!href) {
    return (
      <span className="inline-flex items-center gap-2 text-[var(--cp-primary-300)]" aria-disabled>
        {content}
      </span>
    );
  }

  return (
    <Link
      aria-label={title ? `${label}: ${title}` : label}
      className="inline-flex items-center gap-2 text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-primary-350)]"
      href={href}
    >
      {content}
    </Link>
  );
}

interface PostRelatedArticlesSectionProps {
  block?: Record<string, unknown> | null;
  post: PostDocument;
  posts: PostConnectionNode[];
}

export default function PostRelatedArticlesSection({
  block,
  post,
  posts,
}: PostRelatedArticlesSectionProps) {
  const sortedPosts = getSortedPosts(posts);
  const currentSlug = getPostSlug(post);
  const { previousPost, nextPost } = findAdjacentPosts(sortedPosts, currentSlug);

  const postRecord = post as unknown as Record<string, unknown>;
  const selections = (post.relatedArticles || []).map((entry) => ({ post: entry?.post ?? null }));

  const navigation = previousPost || nextPost ? (
    <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--cp-primary-100)] pt-6 md:mt-12 md:pt-8">
      <ArticleNavigationLink
        direction="previous"
        href={previousPost ? `/post/${getPostSlug(previousPost)}` : undefined}
        label="Prev. article"
        title={previousPost ? text(previousPost.title) : undefined}
      />
      <ArticleNavigationLink
        direction="next"
        href={nextPost ? `/post/${getPostSlug(nextPost)}` : undefined}
        label="Next article"
        title={nextPost ? text(nextPost.title) : undefined}
      />
    </div>
  ) : null;

  return (
    <RelatedArticlesSection
      block={block}
      excludeSlug={currentSlug}
      footer={navigation}
      posts={posts}
      resolveSelectionField={(index) =>
        tinaField(postRecord, `relatedArticles.${index}.post`) || undefined
      }
      selections={selections}
    />
  );
}
