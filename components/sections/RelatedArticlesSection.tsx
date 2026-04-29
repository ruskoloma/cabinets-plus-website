"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import {
  focusTinaSidebarListItem,
  getPostReferenceFocusItemId,
  TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME,
} from "@/lib/tina-list-focus";
import { useTinaQuickEditEnabled } from "@/lib/use-tina-quick-edit-enabled";
import {
  getPostSlug,
  getSortedPosts,
  normalizePostReference,
  text,
} from "@/components/special/post-detail/helpers";
import type { PostConnectionNode } from "@/components/special/post-detail/types";

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

type SelectionRef =
  | string
  | {
      _sys?: { filename?: string | null; relativePath?: string | null } | null;
      [key: string]: unknown;
    }
  | null
  | undefined;

export interface RelatedArticlesSectionProps {
  block?: Record<string, unknown> | null;
  posts: PostConnectionNode[];
  selections?: ReadonlyArray<{ post?: SelectionRef } | null | undefined> | null;
  resolveSelectionField?: (index: number) => string | undefined;
  excludeSlug?: string;
  limit?: number;
  defaultTitle?: string;
  footer?: ReactNode;
  focusListKey?: string;
  focusRootFieldName?: string;
}

interface RelatedCard {
  post: PostConnectionNode;
  selectionField?: string;
  focusItemId?: string;
}

function extractSelectionSlug(value: SelectionRef): string {
  if (typeof value === "string") return normalizePostReference(value);
  if (value && typeof value === "object") {
    const sys = value._sys;
    const filename = typeof sys?.filename === "string" ? sys.filename : "";
    if (filename) return normalizePostReference(filename);
    const relativePath = typeof sys?.relativePath === "string" ? sys.relativePath : "";
    if (relativePath) return normalizePostReference(relativePath);
  }
  return "";
}

function buildCards({
  posts,
  selections,
  excludeSlug,
  resolveSelectionField,
  limit,
}: {
  posts: PostConnectionNode[];
  selections?: ReadonlyArray<{ post?: SelectionRef } | null | undefined> | null;
  excludeSlug?: string;
  resolveSelectionField?: (index: number) => string | undefined;
  limit: number;
}): RelatedCard[] {
  const bySlug = new Map(posts.map((item) => [getPostSlug(item), item] as const));
  const seen = new Set<string>();
  if (excludeSlug) seen.add(excludeSlug);

  const cards: RelatedCard[] = [];

  if (Array.isArray(selections)) {
    selections.forEach((entry, index) => {
      const slug = extractSelectionSlug(entry?.post);
      if (!slug || seen.has(slug)) return;
      const match = bySlug.get(slug);
      if (!match) return;
      seen.add(slug);
      cards.push({
        post: match,
        selectionField: resolveSelectionField?.(index),
        focusItemId: getPostReferenceFocusItemId(entry?.post),
      });
    });
    return cards;
  }

  for (const candidate of getSortedPosts(posts)) {
    if (cards.length >= limit) break;
    const slug = getPostSlug(candidate);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    cards.push({ post: candidate });
  }

  return cards.slice(0, limit);
}

export default function RelatedArticlesSection({
  block,
  posts,
  selections,
  resolveSelectionField,
  excludeSlug,
  limit = 3,
  defaultTitle = "Related articles",
  footer,
  focusListKey,
  focusRootFieldName,
}: RelatedArticlesSectionProps) {
  const { edit } = useEditState();
  const quickEditEnabled = useTinaQuickEditEnabled();
  const canUseCustomFocus = Boolean(edit && quickEditEnabled && focusListKey);

  const cards = buildCards({ posts, selections, excludeSlug, resolveSelectionField, limit });
  if (cards.length === 0 && !footer) return null;

  const title = (readStringField(block, "title") || "").trim() || defaultTitle;
  const imageVariant = resolveConfiguredImageVariant(readStringField(block, "imageSize"), "card");
  const blockField = block ? tinaField(block) || undefined : undefined;
  const titleField = block ? tinaField(block, "title") || undefined : undefined;

  return (
    <section className="bg-[var(--cp-brand-neutral-100)]" data-tina-field={blockField}>
      <div className="cp-container px-4 py-14 md:px-8 md:py-[72px]">
        {cards.length > 0 ? (
          <>
            <h2
              className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] md:text-[32px]"
              data-tina-field={titleField}
            >
              {title}
            </h2>

            <div className="cp-hide-scrollbar mt-10 flex gap-5 overflow-x-auto pb-2 md:mt-12 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:pb-0">
              {cards.map((item, index) => {
                const cardPost = item.post;
                const cardRecord = cardPost as unknown as Record<string, unknown>;
                const cardSlug = getPostSlug(cardPost);
                const cardTitle = text(cardPost.title, "Article");
                const cardThumbnail = text(cardPost.thumbnail);
                const baseClassName = "group block w-[173px] shrink-0 md:w-auto";
                const className = canUseCustomFocus
                  ? `${baseClassName} ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
                  : baseClassName;
                const cardField =
                  !canUseCustomFocus
                    ? item.selectionField || tinaField(cardRecord, "thumbnail") || undefined
                    : undefined;

                const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
                  if (!canUseCustomFocus) return;
                  event.preventDefault();
                  event.stopPropagation();
                  focusTinaSidebarListItem({
                    rootFieldName: focusRootFieldName,
                    listKey: focusListKey as string,
                    itemId: item.focusItemId,
                  });
                };

                return (
                  <Link
                    className={className}
                    data-tina-field={cardField}
                    href={`/post/${cardSlug}`}
                    key={`${cardSlug}-${index}`}
                    onClick={handleClick}
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
                      data-tina-field={canUseCustomFocus ? undefined : tinaField(cardRecord, "title") || undefined}
                    >
                      {cardTitle}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        ) : null}

        {footer}
      </div>
    </section>
  );
}
