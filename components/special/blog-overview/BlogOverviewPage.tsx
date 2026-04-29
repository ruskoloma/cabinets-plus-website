"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import { usePaginationScrollTarget } from "@/components/special/catalog-overview/use-pagination-scroll";
import type { BlogPostNode, BlogPostsDataShape } from "./types";

const DEFAULT_PAGE_SIZE = 12;

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function getPostSlug(post: BlogPostNode | null | undefined) {
  return post?._sys?.filename?.trim() || "";
}

function getSortedPosts(posts: BlogPostNode[]) {
  return [...posts].sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : 0;
    const rightTime = right.date ? new Date(right.date).getTime() : 0;

    if (leftTime !== rightTime) return rightTime - leftTime;

    return text(left.title).localeCompare(text(right.title));
  });
}

function getVisiblePages(totalPages: number, page: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let offset = -1; offset <= 1; offset += 1) {
    const candidate = page + offset;
    if (candidate > 1 && candidate < totalPages) {
      pages.add(candidate);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
}

function PaginationButton({
  active,
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`cp-pagination-button ${active ? "cp-pagination-button--active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function BlogPostCard({
  href,
  image,
  imageVariant,
  title,
  tinaFieldValue,
}: {
  href: string;
  image: string;
  imageVariant?: ReturnType<typeof resolveConfiguredImageVariant>;
  title: string;
  tinaFieldValue?: string;
}) {
  return (
    <Link className="group flex flex-col items-start" data-tina-field={tinaFieldValue} href={href}>
      <span className="relative block aspect-square w-full overflow-hidden bg-[var(--cp-primary-50,#f2f2f2)]">
        {image ? (
          <FillImage
            alt={title}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(min-width: 768px) 33vw, calc((100vw - 47px) / 2)"
            src={image}
            variant={imageVariant}
          />
        ) : null}
      </span>
      <span className="mt-2 flex w-full items-start justify-between gap-2 md:mt-3">
        <span className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
          {title}
        </span>
        <img
          alt=""
          aria-hidden
          className="mt-[1px] h-4 w-4 shrink-0 md:hidden"
          src="/library/header/nav-chevron-right.svg"
        />
      </span>
    </Link>
  );
}

export default function BlogOverviewPage({
  data,
  pageSettingsRecord,
  pageTitle,
  postCardImageSizeChoice,
  postsPerPage,
}: {
  data: BlogPostsDataShape;
  pageSettingsRecord?: Record<string, unknown> | null;
  pageTitle?: string | null;
  postCardImageSizeChoice?: string | null;
  postsPerPage?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/blog";
  const liveSearchParams = useSearchParams();
  const resolvedSearchParams = useMemo(
    () => new URLSearchParams(liveSearchParams?.toString() || ""),
    [liveSearchParams],
  );
  const requestedPage = useMemo(() => {
    const raw = Number.parseInt(resolvedSearchParams.get("page") || "1", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [resolvedSearchParams]);
  const pageSize = postsPerPage && postsPerPage > 0 ? postsPerPage : DEFAULT_PAGE_SIZE;
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const { scrollToTarget: scrollToHeading } = usePaginationScrollTarget(headingRef);

  const allPosts = useMemo(() => {
    const edges = Array.isArray(data?.postConnection?.edges) ? data.postConnection.edges : [];
    const nodes = edges
      .map((edge) => edge?.node)
      .filter((node): node is BlogPostNode => Boolean(node))
      // Hide posts where the editor explicitly turned on "Hide in /blog feed".
      // Default (undefined / null / false) keeps the post visible.
      .filter((node) => node.hideInFeed !== true);
    return getSortedPosts(nodes);
  }, [data]);

  const cardImageVariant = resolveConfiguredImageVariant(postCardImageSizeChoice, "card");

  const totalPosts = allPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  const visiblePosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allPosts.slice(start, start + pageSize);
  }, [allPosts, currentPage, pageSize]);

  const visiblePages = useMemo(() => getVisiblePages(totalPages, currentPage), [currentPage, totalPages]);

  const updatePage = useCallback(
    (nextPage: number) => {
      const nextParams = new URLSearchParams(resolvedSearchParams.toString());
      if (nextPage <= 1) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(nextPage));
      }
      const query = nextParams.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, resolvedSearchParams, router],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage === currentPage) return;
      updatePage(nextPage);
      scrollToHeading();
    },
    [currentPage, scrollToHeading, updatePage],
  );

  return (
    <section className="bg-white">
      <div className="cp-container px-4 pb-16 pt-14 md:px-8 md:pb-[88px] md:pt-[88px]">
        <h1
          className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
          data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "pageTitle") || undefined : undefined}
          ref={headingRef}
        >
          {pageTitle || "Blog"}
        </h1>

        {visiblePosts.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-[15px] gap-y-8 md:mt-12 md:grid-cols-3 md:gap-x-7 md:gap-y-12">
            {visiblePosts.map((post, index) => {
              const slug = getPostSlug(post);
              const title = text(post.title, "Article");
              const thumbnail = text(post.thumbnail);
              const postRecord = post as unknown as Record<string, unknown>;

              return (
                <BlogPostCard
                  href={slug ? `/post/${slug}` : "#"}
                  image={thumbnail}
                  imageVariant={cardImageVariant}
                  key={`${slug || "post"}-${index}`}
                  title={title}
                  tinaFieldValue={tinaField(postRecord, "title") || undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="mt-8 border border-[var(--cp-primary-100)] px-6 py-10 text-center md:mt-12">
            <p className="font-[var(--font-red-hat-display)] text-[20px] text-[var(--cp-primary-500)]">
              No articles published yet.
            </p>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-2 md:mt-20">
            <PaginationButton
              ariaLabel="Previous page"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            >
              <img alt="" aria-hidden className="h-4 w-4 rotate-180" src="/library/header/nav-chevron-right.svg" />
            </PaginationButton>

            {visiblePages.map((page, index) => {
              const previous = visiblePages[index - 1];
              const showEllipsis = previous !== undefined && page - previous > 1;

              return (
                <span className="flex items-center gap-2" key={`page-${page}`}>
                  {showEllipsis ? (
                    <span className="cp-pagination-button cp-pagination-button--ellipsis" aria-hidden>
                      …
                    </span>
                  ) : null}
                  <PaginationButton
                    active={page === currentPage}
                    ariaLabel={`Go to page ${page}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationButton>
                </span>
              );
            })}

            <PaginationButton
              ariaLabel="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            >
              <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-chevron-right.svg" />
            </PaginationButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
