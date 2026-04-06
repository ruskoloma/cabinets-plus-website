"use client";

import type { ComponentProps } from "react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import FillImage from "@/components/ui/FillImage";

type RichTextContent = ComponentProps<typeof TinaMarkdown>["content"];

interface ArticleRichTextProps {
  content: RichTextContent;
}

type ArticleImageProps = {
  image?: string | null;
  alt?: string | null;
  caption?: string | null;
  aspectRatio?: string | null;
};

type InlineImageProps = {
  url: string;
  alt?: string;
  caption?: string;
};

const articleImageStyles: Record<string, { frameClassName: string; variant: "card" | "feature" }> = {
  landscape: {
    frameClassName: "max-w-[908px] aspect-video",
    variant: "feature",
  },
  square: {
    frameClassName: "max-w-[630px] aspect-square",
    variant: "card",
  },
  portrait: {
    frameClassName: "max-w-[840px] aspect-[3/4]",
    variant: "feature",
  },
};

function ArticleImage({ image, alt, caption, aspectRatio }: ArticleImageProps) {
  if (!image) return null;

  const style = articleImageStyles[aspectRatio || "landscape"] || articleImageStyles.landscape;
  const altText = typeof alt === "string" && alt.trim() ? alt.trim() : typeof caption === "string" ? caption.trim() : "Article image";
  const captionText = typeof caption === "string" ? caption.trim() : "";

  return (
    <figure className="my-5 md:my-[50px]">
      <div className={`relative mx-auto w-full overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] ${style.frameClassName}`}>
        <FillImage alt={altText} className="object-cover" sizes="(min-width: 1024px) 908px, 100vw" src={image} variant={style.variant} />
      </div>
      {captionText ? (
        <figcaption className="mx-auto mt-4 max-w-[840px] text-center text-[16px] leading-[1.5] text-[var(--cp-primary-300)]">
          {captionText}
        </figcaption>
      ) : null}
    </figure>
  );
}

function InlineArticleImage({ url, alt, caption }: InlineImageProps) {
  if (!url) return null;

  const altText = typeof alt === "string" && alt.trim() ? alt.trim() : typeof caption === "string" ? caption.trim() : "Article image";
  const captionText = typeof caption === "string" ? caption.trim() : "";

  return (
    <span className="my-5 block md:my-[50px]">
      <img alt={altText} className="block h-auto w-full rounded-[2px]" src={url} />
      {captionText ? (
        <span className="mx-auto mt-4 block max-w-[840px] text-center text-[16px] leading-[1.5] text-[var(--cp-primary-300)]">
          {captionText}
        </span>
      ) : null}
    </span>
  );
}

export default function ArticleRichText({ content }: ArticleRichTextProps) {
  return (
    <div className="cp-article-body">
      <TinaMarkdown
        components={{
          ArticleImage: ((props: unknown) => <ArticleImage {...(props as ArticleImageProps)} />) as never,
          img: ((props: unknown) => <InlineArticleImage {...(props as InlineImageProps)} />) as never,
        }}
        content={content}
      />
    </div>
  );
}
