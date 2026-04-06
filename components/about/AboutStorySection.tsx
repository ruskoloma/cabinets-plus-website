"use client";

import type { ComponentProps } from "react";
import { tinaField } from "tinacms/dist/react";
import ArticleRichText from "@/components/post/ArticleRichText";

interface AboutStorySectionProps {
  block: Record<string, unknown>;
}

type RichTextContent = ComponentProps<typeof ArticleRichText>["content"];

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function createTextNode(value: string) {
  return { type: "text", text: value };
}

function createParagraphNode(value: string) {
  const children: Array<Record<string, unknown>> = [];
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;

  for (const match of value.matchAll(boldPattern)) {
    const matchIndex = match.index ?? 0;
    const boldText = match[1] || "";

    if (matchIndex > lastIndex) {
      children.push(createTextNode(value.slice(lastIndex, matchIndex)));
    }

    if (boldText) {
      children.push({
        type: "bold",
        children: [createTextNode(boldText)],
      });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < value.length) {
    children.push(createTextNode(value.slice(lastIndex)));
  }

  return {
    type: "p",
    children: children.length > 0 ? children : [createTextNode(value)],
  };
}

function normalizeBodyContent(value: unknown): RichTextContent {
  if (value && typeof value === "object") {
    return value as RichTextContent;
  }

  if (typeof value !== "string") {
    return { type: "root", children: [] } as RichTextContent;
  }

  const paragraphs = value
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => createParagraphNode(paragraph));

  return {
    type: "root",
    children: paragraphs,
  } as RichTextContent;
}

export default function AboutStorySection({ block }: AboutStorySectionProps) {
  const body = normalizeBodyContent(block.body);

  return (
    <section className="cp-about-story bg-white py-12 md:py-[88px]" data-tina-field={tinaField(block)}>
      <div className="mx-auto max-w-[1142px] px-4 md:px-0">
        <h2
          className="text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
          data-tina-field={tinaField(block, "title")}
        >
          {text(block.title, "Our Story")}
        </h2>

        <div className="mt-8 md:mt-7" data-tina-field={tinaField(block, "body")}>
          <ArticleRichText content={body} />
        </div>
      </div>
    </section>
  );
}
