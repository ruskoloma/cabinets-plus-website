"use client";

import Link from "next/link";
import { tinaField, useTina } from "tinacms/dist/react";
import { POST_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { PostPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import ArticleRichText from "@/components/post/ArticleRichText";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { PostConnectionQuery, PostConnectionQueryVariables, PostQuery, PostQueryVariables } from "@/tina/__generated__/types";
type PostEdge = NonNullable<PostConnectionQuery["postConnection"]["edges"]>[number];
type PostConnectionNode = NonNullable<NonNullable<PostEdge>["node"]>;

interface PostsQueryLikeResult {
  data: PostConnectionQuery;
  query: string;
  variables: PostConnectionQueryVariables;
}

interface PostClientProps {
  data: PostQuery;
  query: string;
  variables: PostQueryVariables;
  postsData: PostsQueryLikeResult;
  pageSettingsData: PostPageSettingsQueryLikeResult;
}

interface RelatedArticleCard {
  post: PostConnectionNode;
  selectionField?: string;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function getPostSlug(post: { _sys: { filename: string } } | null | undefined) {
  return post?._sys?.filename?.trim() || "";
}

function normalizePostReference(reference: string) {
  return reference
    .trim()
    .replace(/^\/+/, "")
    .replace(/^content\/posts\//i, "")
    .replace(/^posts\//i, "")
    .replace(/\.md$/i, "");
}

function getSortedPosts(posts: PostConnectionNode[]) {
  return [...posts].sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : 0;
    const rightTime = right.date ? new Date(right.date).getTime() : 0;

    if (leftTime !== rightTime) return rightTime - leftTime;

    return text(left.title).localeCompare(text(right.title));
  });
}

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden
      className="h-6 w-6 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
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

export default function PostClient(props: PostClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query,
    variables: props.variables,
  });
  const { data: postsQueryData } = useTina({
    data: props.postsData.data,
    query: props.postsData.query,
    variables: props.postsData.variables,
  });
  const { data: pageSettingsData } = useTina({
    data: props.pageSettingsData.data,
    query: props.pageSettingsData.query?.trim() || POST_PAGE_SETTINGS_QUERY,
    variables: props.pageSettingsData.variables || {},
  });

  const post = data.post;
  if (!post) return null;

  const livePosts = (postsQueryData.postConnection.edges || [])
    .map((edge) => edge?.node)
    .filter((node): node is PostConnectionNode => Boolean(node));
  const sortedPosts = getSortedPosts(livePosts);
  const currentSlug = getPostSlug(post);
  const currentIndex = sortedPosts.findIndex((item) => getPostSlug(item) === currentSlug);
  const previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  const title = text(post.title, "Article");
  const subtitle = text(post.subtitle);
  const excerpt = text(post.excerpt);
  const thumbnail = text(post.thumbnail);
  const breadcrumbLabel = text(pageSettingsData.postPageSettings?.postBreadcrumbLabel, "Articles");
  const relatedTitle = text(pageSettingsData.postPageSettings?.postRelatedArticlesTitle, "Related articles");
  const body = post.body || null;

  const heroImageVariant = resolveConfiguredImageVariant(
    pageSettingsData.postPageSettings?.postDetailThumbnailImageSize,
    "feature",
  );
  const relatedImageVariant = resolveConfiguredImageVariant(
    pageSettingsData.postPageSettings?.postDetailRelatedArticlesImageSize,
    "card",
  );

  const pageSettingsRecord =
    pageSettingsData.postPageSettings && typeof pageSettingsData.postPageSettings === "object"
      ? (pageSettingsData.postPageSettings as Record<string, unknown>)
      : null;
  const postRecord = post as unknown as Record<string, unknown>;
  const bySlug = new Map(sortedPosts.map((item) => [getPostSlug(item), item] as const));
  const explicitRelated = post.relatedArticles || [];
  const relatedCards: RelatedArticleCard[] = [];
  const seenSlugs = new Set<string>([currentSlug]);

  explicitRelated.forEach((entry, index) => {
    const slug = normalizePostReference(text(entry?.post));
    if (!slug || seenSlugs.has(slug)) return;

    const relatedPost = bySlug.get(slug);
    if (!relatedPost) return;

    seenSlugs.add(slug);
    relatedCards.push({
      post: relatedPost,
      selectionField: tinaField(postRecord, `relatedArticles.${index}.post`) || undefined,
    });
  });

  for (const candidate of sortedPosts) {
    if (relatedCards.length >= 3) break;

    const slug = getPostSlug(candidate);
    if (!slug || seenSlugs.has(slug)) continue;

    seenSlugs.add(slug);
    relatedCards.push({ post: candidate });
  }

  const showRelatedSection = relatedCards.length > 0 || previousPost || nextPost;

  return (
    <article className="bg-white text-[var(--cp-primary-500)]">
      <section
        className="relative h-[697px] overflow-hidden bg-[var(--cp-brand-neutral-800)]"
        data-tina-field={tinaField(postRecord) || undefined}
      >
        {thumbnail ? (
          <div className="absolute inset-0" data-tina-field={tinaField(postRecord, "thumbnail") || undefined}>
            <FillImage
              alt={title}
              className="object-cover"
              sizes="100vw"
              src={thumbnail}
              variant={heroImageVariant}
            />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(46,46,46,0.08)_0%,rgba(46,46,46,0.88)_100%)]" />

        <div className="cp-container relative flex h-full items-end px-[17px] pb-8 md:px-8 md:pb-[79px]">
          <div className="max-w-[712px] text-white">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-[14px] leading-[1.2] text-white/80"
            >
              <span data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "postBreadcrumbLabel") || undefined : undefined}>
                {breadcrumbLabel}
              </span>
              <span>/</span>
              <span data-tina-field={tinaField(postRecord, "title") || undefined}>{title}</span>
            </nav>

            <h1
              className="mt-4 font-[var(--font-red-hat-display)] text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] md:text-[48px] md:font-normal"
              data-tina-field={tinaField(postRecord, "title") || undefined}
            >
              {title}
            </h1>

            {subtitle ? (
              <p
                className="mt-4 max-w-[712px] text-[16px] font-medium leading-[1.5] text-white md:mt-6 md:text-[18px]"
                data-tina-field={tinaField(postRecord, "subtitle") || undefined}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {excerpt ? (
        <section className="bg-white" data-tina-field={tinaField(postRecord, "excerpt") || undefined}>
          <div className="cp-container px-[17px] py-12 md:px-8 md:py-16">
            <p
              className="max-w-[908px] text-[20px] leading-[1.5] md:text-[24px]"
              data-tina-field={tinaField(postRecord, "excerpt") || undefined}
            >
              {excerpt}
            </p>
          </div>
        </section>
      ) : null}

      {body ? (
        <section className="bg-white" data-tina-field={tinaField(postRecord, "body") || undefined}>
          <div className="cp-container px-[17px] pb-[72px] md:px-8 md:pb-24">
            <div className="max-w-[908px]" data-tina-field={tinaField(postRecord, "body") || undefined}>
              <ArticleRichText content={body} />
            </div>
          </div>
        </section>
      ) : null}

      {showRelatedSection ? (
        <section
          className="bg-[var(--cp-brand-neutral-100)]"
          data-tina-field={
            tinaField(postRecord, "relatedArticles") ||
            (pageSettingsRecord ? tinaField(pageSettingsRecord, "postRelatedArticlesTitle") || undefined : undefined)
          }
        >
          <div className="cp-container px-[17px] py-14 md:px-8 md:py-[72px]">
            {relatedCards.length > 0 ? (
              <>
                <h2
                  className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] md:text-[32px]"
                  data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "postRelatedArticlesTitle") || undefined : undefined}
                >
                  {relatedTitle}
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
                              variant={relatedImageVariant}
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
      ) : null}
    </article>
  );
}
