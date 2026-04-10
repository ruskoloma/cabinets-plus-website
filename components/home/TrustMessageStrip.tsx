"use client";

import { tinaField } from "tinacms/dist/react";
import FallbackImg from "@/components/ui/FallbackImg";

interface TrustMessageStripProps {
  block: Record<string, unknown>;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function splitWithHighlight(content: string, highlight: string) {
  if (!highlight || !content.includes(highlight)) {
    return { before: content, marked: "", after: "" };
  }

  const start = content.indexOf(highlight);
  const before = content.slice(0, start);
  const marked = content.slice(start, start + highlight.length);
  const after = content.slice(start + highlight.length);

  return { before, marked, after };
}

export default function TrustMessageStrip({ block }: TrustMessageStripProps) {
  const stripText = text(
    block.trustStripText,
    "You're buying from people you can call directly if anything needs attention, not a 1-800 number three states away.",
  );
  const stripHighlight = text(block.trustStripHighlight, "you can call directly");
  const stripTexture = text(
    block.trustStripTexture,
    "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-strip-texture.jpg",
  );
  const { before, marked, after } = splitWithHighlight(stripText, stripHighlight);

  return (
    <section className="bg-[var(--cp-brand-neutral-100)]" data-tina-field={tinaField(block)}>
      <div className="relative overflow-hidden">
        <FallbackImg
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
          data-tina-field={tinaField(block, "trustStripTexture")}
          src={stripTexture}
          variant="full"
        />
        <div className="cp-container relative px-4 py-[33px] md:px-8">
          <p
            className="mx-auto max-w-[1376px] text-center font-[var(--font-red-hat-display)] text-[20px] font-medium leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]"
            data-tina-field={tinaField(block, "trustStripText")}
          >
            {before}
            {marked ? (
              <strong className="font-black" data-tina-field={tinaField(block, "trustStripHighlight")}>
                {marked}
              </strong>
            ) : null}
            {after}
          </p>
        </div>
      </div>
    </section>
  );
}
