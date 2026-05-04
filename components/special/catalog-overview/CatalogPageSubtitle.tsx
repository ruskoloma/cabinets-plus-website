"use client";

import type { ComponentProps } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

type RichTextContent = ComponentProps<typeof TinaMarkdown>["content"];

interface CatalogPageSubtitleProps {
  block?: Record<string, unknown> | null;
}

function normalizeStringRichText(value: string): RichTextContent | null {
  const children = value
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "p",
      children: [{ type: "text", text: paragraph }],
    }));

  return children.length ? ({ type: "root", children } as unknown as RichTextContent) : null;
}

function collectTextChildren(children: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(children)) return [];

  return children.flatMap((child) => {
    if (!child || typeof child !== "object") return [];
    const record = child as Record<string, unknown>;

    if (record.type === "text" && typeof record.text === "string") {
      const text = record.text;
      if (!text.trim()) return [];

      return [{
        type: "text",
        text,
        bold: record.bold,
        italic: record.italic,
      }];
    }

    return collectTextChildren(record.children);
  });
}

function normalizeRichText(value: unknown): RichTextContent | null {
  if (!value) return null;
  if (typeof value === "string") return normalizeStringRichText(value);
  if (typeof value !== "object") return null;

  const children = (value as { children?: unknown }).children;
  if (!Array.isArray(children)) return null;

  const paragraphs = children
    .map((child) => {
      if (!child || typeof child !== "object") return null;
      const textChildren = collectTextChildren((child as Record<string, unknown>).children);

      return textChildren.length ? { type: "p", children: textChildren } : null;
    })
    .filter(Boolean);

  return paragraphs.length ? ({ type: "root", children: paragraphs } as unknown as RichTextContent) : null;
}

export default function CatalogPageSubtitle({ block }: CatalogPageSubtitleProps) {
  const content = normalizeRichText(block?.pageSubtitle);

  if (!content) return null;

  return (
    <div
      className="mt-3 max-w-[760px] font-[var(--font-jost)] text-[18px] leading-[1.55] text-[var(--cp-primary-500)] md:mt-4 md:text-[20px] [&_em]:italic [&_p+p]:mt-3 [&_strong]:font-semibold"
      data-tina-field={block ? tinaField(block, "pageSubtitle") || undefined : undefined}
    >
      <TinaMarkdown content={content} />
    </div>
  );
}
