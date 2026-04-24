"use client";

import type { ComponentProps } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";

type RichTextContent = ComponentProps<typeof TinaMarkdown>["content"];

interface Props {
  block: Record<string, unknown>;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

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

export default function TextImageSection({ block }: Props) {
  const title = text(block.title);
  const paragraphsContent = normalizeRichText(block.paragraphs);
  const image = text(block.image);
  const imagePosition = text(block.imagePosition, "right");
  const ctaLabel = text(block.ctaLabel);
  const ctaLink = text(block.ctaLink, "/contact-us");

  const imageOnLeft = imagePosition === "left";

  const textColumn = (
    <div className={imageOnLeft ? "order-2 md:order-2" : "order-1 md:order-1"}>
      {title ? (
        <h2
          className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)]"
          data-tina-field={tinaField(block, "title")}
        >
          {title}
        </h2>
      ) : null}
      {paragraphsContent ? (
        <div
          className="mt-8 space-y-4 text-[16px] font-normal leading-[1.5] text-[var(--cp-primary-500)] md:mt-6 md:text-[18px] [&_a]:text-[var(--cp-primary-400)] [&_a]:underline [&_a]:underline-offset-[0.14em] [&_a:hover]:text-[var(--cp-primary-350)] [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li+li]:mt-1"
          data-tina-field={tinaField(block, "paragraphs")}
        >
          <TinaMarkdown content={paragraphsContent} />
        </div>
      ) : null}
      {ctaLabel ? (
        <div className="mt-4 md:mt-6">
          <Button
            dataTinaField={tinaField(block, "ctaLabel")}
            href={ctaLink}
            variant="secondary"
          >
            {ctaLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );

  const imageColumn = image ? (
    <div className={imageOnLeft ? "order-1 md:order-1" : "order-2 md:order-2"}>
      <div
        className="relative aspect-[275/361] w-full overflow-hidden rounded-[1.071px] md:aspect-auto md:h-[514px] md:rounded-[2px]"
        data-tina-field={tinaField(block, "image")}
      >
        <FillImage
          alt={title || "Section image"}
          className="object-cover"
          sizes="(min-width: 768px) 674px, 100vw"
          src={image}
          variant="full"
        />
      </div>
    </div>
  ) : null;

  return (
    <section className="bg-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-[64px]">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-center md:gap-[28px]">
          {textColumn}
          {imageColumn}
        </div>
      </div>
    </section>
  );
}
