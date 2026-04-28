"use client";

import { tinaField } from "tinacms/dist/react";
import ArticleBodySection from "@/components/post/ArticleBodySection";
import PostPageHero from "@/components/post/PostPageHero";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import { text } from "./helpers";
import type { PostDocument } from "./types";

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

interface PostContentSectionProps {
  block?: Record<string, unknown> | null;
  post: PostDocument;
}

export default function PostContentSection({ block, post }: PostContentSectionProps) {
  const postRecord = post as unknown as Record<string, unknown>;
  const title = text(post.title, "Article");
  const subtitle = text(post.subtitle);
  const thumbnail = text(post.thumbnail);
  const body = (postRecord.body ?? null) as React.ComponentProps<typeof ArticleBodySection>["content"];

  const breadcrumbLabel = (readStringField(block, "breadcrumbLabel") || "").trim() || "Articles";
  const heroImageVariant = resolveConfiguredImageVariant(readStringField(block, "heroImageSize"), "feature");
  const blockField = block ? tinaField(block) || undefined : undefined;

  return (
    <>
      <PostPageHero
        breadcrumbItems={[
          {
            label: breadcrumbLabel,
            tinaFieldValue: block ? tinaField(block, "breadcrumbLabel") || undefined : undefined,
          },
          { label: title, tinaFieldValue: tinaField(postRecord, "title") || undefined },
        ]}
        imageVariant={heroImageVariant}
        rootTinaFieldValue={blockField}
        subtitle={subtitle}
        subtitleTinaFieldValue={tinaField(postRecord, "subtitle") || undefined}
        thumbnail={thumbnail}
        thumbnailTinaFieldValue={tinaField(postRecord, "thumbnail") || undefined}
        title={title}
        titleTinaFieldValue={tinaField(postRecord, "title") || undefined}
      />

      <ArticleBodySection
        content={body}
        innerTinaFieldValue={tinaField(postRecord, "body") || undefined}
        rootTinaFieldValue={blockField}
      />
    </>
  );
}
