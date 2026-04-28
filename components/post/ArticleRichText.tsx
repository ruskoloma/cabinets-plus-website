"use client";

import { type ComponentProps } from "react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import FillImage from "@/components/ui/FillImage";
import { extractYouTubeId } from "@/lib/youtube";

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

function YouTubeEmbed({ id }: { id: string }) {
  return (
    <span className="my-5 block md:my-[50px]">
      <span className="relative block aspect-video w-full overflow-hidden rounded-[2px] bg-black">
        <iframe
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="YouTube video"
        />
      </span>
    </span>
  );
}

// Tina rich-text stores body as an AST: { type: "root", children: [...] }.
// We walk the AST once before rendering and rewrite "paragraph containing
// only a bare YouTube URL" into a custom `youtubeEmbed` node, then provide a
// renderer for that node below. This keeps the `[custom text](youtube-url)`
// case rendering as a regular link.
function rewriteYouTubeEmbeds(content: RichTextContent): RichTextContent {
  if (!content || typeof content !== "object") return content;
  const root = content as { children?: unknown };
  if (!Array.isArray(root.children)) return content;
  return { ...(content as object), children: root.children.map(rewriteNode) } as RichTextContent;
}

function rewriteNode(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;
  const record = node as Record<string, unknown>;

  if (record.type === "p" && Array.isArray(record.children) && record.children.length === 1) {
    const link = record.children[0] as Record<string, unknown> | null;
    if (link && link.type === "a" && typeof link.url === "string") {
      const id = extractYouTubeId(link.url);
      const linkChildren = Array.isArray(link.children) ? link.children : [];
      const text = linkChildren
        .map((child) => {
          if (!child || typeof child !== "object") return "";
          const childRecord = child as Record<string, unknown>;
          return childRecord.type === "text" && typeof childRecord.text === "string" ? childRecord.text : "";
        })
        .join("");
      if (id && text.trim() === link.url.trim()) {
        // TinaMarkdown only recognizes custom node types via mdxJsxFlowElement.name
        // (see node_modules/tinacms/dist/rich-text/index.js).
        return { type: "mdxJsxFlowElement", name: "youtubeEmbed", props: { id } };
      }
    }
  }

  return node;
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
          youtubeEmbed: ((props: unknown) => <YouTubeEmbed id={(props as { id: string }).id} />) as never,
        }}
        content={rewriteYouTubeEmbeds(content)}
      />
    </div>
  );
}
