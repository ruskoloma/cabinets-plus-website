"use client";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

export default function PostClient(props: { data: any; query: string; variables: any }) {
  const { data } = useTina(props);
  const post = data.post;

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
        {post.title}
      </h1>
      {post.excerpt && (
        <p
          data-tina-field={tinaField(post, "excerpt")}
          className="text-lg text-slate-500 border-l-4 border-amber-500 pl-5 mb-10 leading-relaxed"
        >
          {post.excerpt}
        </p>
      )}
      {post.thumbnail && (
        <img src={post.thumbnail} alt={post.title} className="w-full rounded-xl mb-10 object-cover h-72" />
      )}
      {/* Rich text body */}
      <div
        data-tina-field={tinaField(post, "body")}
        className="prose prose-slate prose-headings:text-slate-800 prose-a:text-amber-600 max-w-none"
      >
        <TinaMarkdown content={post.body} />
      </div>
    </article>
  );
}
