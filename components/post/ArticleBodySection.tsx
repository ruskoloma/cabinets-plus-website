"use client";

import type { ComponentProps } from "react";
import ArticleRichText from "@/components/post/ArticleRichText";

interface ArticleBodySectionProps {
  content: ComponentProps<typeof ArticleRichText>["content"];
  rootTinaFieldValue?: string;
  innerTinaFieldValue?: string;
}

export default function ArticleBodySection({
  content,
  rootTinaFieldValue,
  innerTinaFieldValue,
}: ArticleBodySectionProps) {
  if (!content) return null;

  return (
    <section className="bg-white" data-tina-field={rootTinaFieldValue}>
      <div className="cp-container px-4 pb-[72px] pt-12 md:px-8 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-[908px]" data-tina-field={innerTinaFieldValue}>
          <ArticleRichText content={content} />
        </div>
      </div>
    </section>
  );
}
