"use client";

import type { ComponentProps, CSSProperties } from "react";
import { useState } from "react";
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

function parseInlineBold(textValue: string) {
  return textValue
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      return boldMatch
        ? { type: "text", text: boldMatch[1], bold: true }
        : { type: "text", text: part };
    });
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
      children: parseInlineBold(paragraph),
    }));

  return { type: "root", children } as unknown as RichTextContent;
}

function BeforeAfterImageViewer({
  afterImage,
  afterLabel,
  beforeImage,
  beforeLabel,
  title,
  block,
}: {
  afterImage: string;
  afterLabel: string;
  beforeImage: string;
  beforeLabel: string;
  title: string;
  block: Record<string, unknown>;
}) {
  const [position, setPosition] = useState(50);
  const clipStyle = { clipPath: `inset(0 ${100 - position}% 0 0)` } as CSSProperties;
  const handleStyle = { left: `${position}%` } as CSSProperties;

  return (
    <div className="relative aspect-[275/361] w-full overflow-hidden rounded-[1.071px] bg-[var(--cp-brand-neutral-100)] md:aspect-auto md:h-[514px] md:rounded-[2px]">
      <div className="absolute inset-0" data-tina-field={tinaField(block, "afterImage")}>
        <FillImage
          alt={`${title || "Project"} after`}
          className="object-cover"
          sizes="(min-width: 768px) 674px, 100vw"
          src={afterImage}
          variant="full"
        />
      </div>

      <div
        className="absolute inset-0"
        data-tina-field={tinaField(block, "beforeImage")}
        style={clipStyle}
      >
        <FillImage
          alt={`${title || "Project"} before`}
          className="object-cover"
          sizes="(min-width: 768px) 674px, 100vw"
          src={beforeImage}
          variant="full"
        />
      </div>

      <span className="absolute left-3 top-3 bg-white px-3 py-1 text-[12px] font-medium uppercase leading-5 tracking-[0.04em] text-[var(--cp-primary-500)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 bg-white px-3 py-1 text-[12px] font-medium uppercase leading-5 tracking-[0.04em] text-[var(--cp-primary-500)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {afterLabel}
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(46,46,46,0.15)]"
        style={handleStyle}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--cp-primary-100)] bg-white text-[var(--cp-primary-500)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={handleStyle}
      >
        <span className="h-4 w-px bg-current" />
        <span className="mx-1 h-4 w-px bg-current" />
      </span>

      <input
        aria-label={`${title || "Before and after"} image comparison`}
        className="absolute inset-0 h-full w-full cursor-col-resize opacity-0"
        max="100"
        min="0"
        onChange={(event) => setPosition(Number(event.target.value))}
        type="range"
        value={position}
      />
    </div>
  );
}

export default function BeforeAfterTextImageSection({ block }: Props) {
  const title = text(block.title);
  const paragraphsContent = normalizeRichText(block.paragraphs);
  const beforeImage = text(block.beforeImage);
  const afterImage = text(block.afterImage);
  const beforeLabel = text(block.beforeLabel, "Before");
  const afterLabel = text(block.afterLabel, "After");
  const imagePosition = text(block.imagePosition, "right");
  const ctaLabel = text(block.ctaLabel);
  const ctaLink = text(block.ctaLink, "/contact-us");
  const anchorId = text(block.anchorId);
  const fallbackImage = beforeImage || afterImage;
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

  const imageColumn = fallbackImage ? (
    <div className={imageOnLeft ? "order-1 md:order-1" : "order-2 md:order-2"}>
      <BeforeAfterImageViewer
        afterImage={afterImage || fallbackImage}
        afterLabel={afterLabel}
        beforeImage={beforeImage || fallbackImage}
        beforeLabel={beforeLabel}
        block={block}
        title={title}
      />
    </div>
  ) : null;

  return (
    <section className="bg-white scroll-mt-24" data-tina-field={tinaField(block)} id={anchorId || undefined}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-[64px]">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-center md:gap-[28px]">
          {textColumn}
          {imageColumn}
        </div>
      </div>
    </section>
  );
}
