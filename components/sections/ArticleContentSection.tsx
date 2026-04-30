"use client";

import type { ComponentProps } from "react";
import { tinaField } from "tinacms/dist/react";
import ArticleBodySection from "@/components/post/ArticleBodySection";
import PostPageHero from "@/components/post/PostPageHero";

type ArticleContent = ComponentProps<typeof ArticleBodySection>["content"];

interface ArticleContentSectionProps {
  block: Record<string, unknown>;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeBodyContent(value: unknown): ArticleContent {
  if (value && typeof value === "object") {
    return value as ArticleContent;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null as unknown as ArticleContent;
  }

  return {
    type: "root",
    children: value
      .split(/\n\s*\n/g)
      .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
      .filter(Boolean)
      .map((paragraph) => ({
        type: "p",
        children: [{ type: "text", text: paragraph }],
      })),
  } as unknown as ArticleContent;
}

export default function ArticleContentSection({ block }: ArticleContentSectionProps) {
  const title = text(block.title, "Article");
  const subtitle = text(block.subtitle);
  const breadcrumbLabel = text(block.breadcrumbLabel, "Page");
  const body = normalizeBodyContent(block.body);

  return (
    <article className="bg-white text-[var(--cp-primary-500)]" data-tina-field={tinaField(block)}>
      <PostPageHero
        breadcrumbItems={[
          { label: breadcrumbLabel, tinaFieldValue: tinaField(block, "breadcrumbLabel") || undefined },
          { label: title, tinaFieldValue: tinaField(block, "title") || undefined },
        ]}
        rootTinaFieldValue={tinaField(block) || undefined}
        subtitle={subtitle}
        subtitleTinaFieldValue={tinaField(block, "subtitle") || undefined}
        title={title}
        titleTinaFieldValue={tinaField(block, "title") || undefined}
      />

      <ArticleBodySection
        content={body}
        innerTinaFieldValue={tinaField(block, "body") || undefined}
        rootTinaFieldValue={tinaField(block, "body") || undefined}
      />
    </article>
  );
}
