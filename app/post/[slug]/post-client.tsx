"use client";
import type { ComponentProps } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

type RichTextContent = ComponentProps<typeof TinaMarkdown>["content"];

interface PostDocument extends Record<string, unknown> {
  title?: string | null;
  excerpt?: string | null;
  thumbnail?: string | null;
  date?: string | null;
  body?: RichTextContent | null;
}

interface PostClientProps {
  data: { post?: PostDocument | null };
  query: string;
  variables: Record<string, unknown>;
}

export default function PostClient(props: PostClientProps) {
  const { data } = useTina(props);
  const post = data.post;
  if (!post) return null;
  const title = typeof post.title === "string" ? post.title : "";
  const excerpt = typeof post.excerpt === "string" ? post.excerpt : "";
  const thumbnail = typeof post.thumbnail === "string" ? post.thumbnail : undefined;
  const body = post.body || null;

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      {/* Meta */}
      {post.date && (
        <p className="text-sm text-amber-600 font-semibold mb-3">
          {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      )}
      <h1
        data-tina-field={tinaField(post, "title")}
        className="text-4xl font-bold text-slate-800 leading-tight mb-6"
      >
        {title}
      </h1>
      {excerpt && (
        <p
          data-tina-field={tinaField(post, "excerpt")}
          className="text-lg text-slate-500 border-l-4 border-amber-500 pl-5 mb-10 leading-relaxed"
        >
          {excerpt}
        </p>
      )}
      {thumbnail && (
        <img src={thumbnail} alt={title || "Post"} className="w-full rounded-xl mb-10 object-cover h-72" />
      )}
      {/* Rich text body */}
      {body ? (
        <div
          data-tina-field={tinaField(post, "body")}
          className="prose prose-slate prose-headings:text-slate-800 prose-a:text-amber-600 max-w-none"
        >
          <TinaMarkdown content={body} />
        </div>
      ) : null}
    </article>
  );
}
