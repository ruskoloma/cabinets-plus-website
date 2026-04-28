"use client";

import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import {
  buildRelatedCards,
  findAdjacentPosts,
  getPostSlug,
  getSortedPosts,
  text,
} from "./helpers";
import type { PostConnectionNode, PostDocument } from "./types";

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

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
  const postRecord = post as unknown as Record<string, unknown>;
  const sortedPosts = getSortedPosts(posts);
  const currentSlug = getPostSlug(post);
  const { previousPost, nextPost } = findAdjacentPosts(sortedPosts, currentSlug);

  const relatedCards = buildRelatedCards({
    post,
    sortedPosts,
    resolveSelectionField: (index) =>
      tinaField(postRecord, `relatedArticles.${index}.post`) || undefined,
  });

  if (relatedCards.length === 0 && !previousPost && !nextPost) return null;

  const title = (readStringField(block, "title") || "").trim() || "Related articles";
  const imageVariant = resolveConfiguredImageVariant(readStringField(block, "imageSize"), "card");
  const blockField = block ? tinaField(block) || undefined : undefined;

  return (
    <section className="bg-[var(--cp-brand-neutral-100)]" data-tina-field={blockField}>
      <div className="cp-container px-4 py-14 md:px-8 md:py-[72px]">
        {relatedCards.length > 0 ? (
          <>
            <h2
              className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] md:text-[32px]"
              data-tina-field={block ? tinaField(block, "title") || undefined : undefined}
            >
              {title}
            </h2>

            <div className="cp-hide-scrollbar mt-10 flex gap-5 overflow-x-auto pb-2 md:mt-12 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:pb-0">
              {relatedCards.map((item, index) => {
                const cardPost = item.post;
                const cardRecord = cardPost as unknown as Record<string, unknown>;
                const cardSlug = getPostSlug(cardPost);
                const cardTitle = text(cardPost.title, "Article");
                const cardThumbnail = text(cardPost.thumbnail);
                const cardField = item.selectionField || tinaField(cardRecord, "thumbnail") || undefined;

                return (
                  <Link
                    className="group block w-[173px] shrink-0 md:w-auto"
                    data-tina-field={cardField}
                    href={`/post/${cardSlug}`}
                    key={`${cardSlug}-${index}`}
                  >
                    <div className="relative aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
                      {cardThumbnail ? (
                        <FillImage
                          alt={cardTitle}
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(min-width: 768px) 33vw, 173px"
                          src={cardThumbnail}
                          variant={imageVariant}
                        />
                      ) : null}
                    </div>
                    <p
                      className="mt-4 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] transition-colors group-hover:text-[var(--cp-primary-350)]"
                      data-tina-field={tinaField(cardRecord, "title") || undefined}
                    >
                      {cardTitle}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        ) : null}

        {previousPost || nextPost ? (
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
        ) : null}
      </div>
    </section>
  );
}
