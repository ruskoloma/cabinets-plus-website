"use client";

import type { ComponentProps } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import FallbackImg from "@/components/ui/FallbackImg";

type RichTextContent = ComponentProps<typeof TinaMarkdown>["content"];

interface TrustMessageStripProps {
  block: Record<string, unknown>;
}

const FALLBACK_TEXTURE =
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-strip-texture.jpg";

function hasRichText(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") {
    const children = (value as { children?: unknown }).children;
    return Array.isArray(children) && children.length > 0;
  }
  return false;
}

function normalizeRichText(value: unknown): RichTextContent | null {
  if (!hasRichText(value)) return null;

  if (typeof value !== "string") {
    return value as RichTextContent;
  }

  const children = value
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "p",
      children: [{ type: "text", text: paragraph }],
    }));

  return { type: "root", children } as unknown as RichTextContent;
}

export default function TrustMessageStrip({ block }: TrustMessageStripProps) {
  const content = normalizeRichText(block.trustStripContent);
  const stripTexture = typeof block.trustStripTexture === "string" ? block.trustStripTexture : FALLBACK_TEXTURE;

  return (
    <section className="relative overflow-hidden bg-[var(--cp-brand-neutral-100)]" data-tina-field={tinaField(block)}>
      <FallbackImg
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-35"
        data-tina-field={tinaField(block, "trustStripTexture")}
        src={stripTexture}
        variant="full"
      />
      <div
        className="cp-container relative px-4 py-[33px] md:px-8 [&_p]:mx-auto [&_p]:max-w-[1376px] [&_p]:text-center [&_p]:font-[var(--font-red-hat-display)] [&_p]:text-[20px] [&_p]:font-medium [&_p]:leading-[1.25] [&_p]:text-[var(--cp-primary-500)] md:[&_p]:text-[28px] [&_strong]:font-black"
        data-tina-field={tinaField(block, "trustStripContent")}
      >
        {content ? <TinaMarkdown content={content} /> : null}
      </div>
    </section>
  );
}
