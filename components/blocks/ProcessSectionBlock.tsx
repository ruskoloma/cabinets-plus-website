"use client";

import { tinaField } from "tinacms/dist/react";
import FallbackImg from "@/components/ui/FallbackImg";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

const FALLBACK_PROCESS_ICONS = [
  "/library/process/process-step-1.svg",
  "/library/process/process-step-2.svg",
  "/library/process/process-step-3.svg",
  "/library/process/process-step-4.svg",
];

const processDesktopLineSegments = [
  { left: "22px", top: "65px", height: "80px" },
  { left: "22px", top: "221px", height: "80px" },
  { left: "23px", top: "380px", height: "80px" },
];

const processMobileLineSegments = [
  { left: "19px", top: "66px", height: "176px" },
  { left: "18px", top: "349px", height: "222px" },
  { left: "15px", top: "666px", height: "215px" },
];

export default function ProcessSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const steps = asBlockArray(block.steps)
    .map((item) => ({
      raw: item as Record<string, unknown>,
      iconImage: asText(item.iconImage) || undefined,
      title: asText(item.title),
      description: asText(item.description),
    }))
    .filter((item) => item.title.length > 0);

  return (
    <section className="bg-[var(--cp-brand-neutral-50)] py-20" data-tina-field={tinaField(record)}>
      <div className="cp-container px-4 md:px-[130px]">
        <h2
          className="text-center text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
          data-tina-field={tinaField(record, "title")}
        >
          {asText(block.title, "Our process")}
        </h2>

        <div className="relative mx-auto mt-12 w-full max-w-[361px] md:max-w-[1018px]">
          {processMobileLineSegments.map((segment, index) => (
            <span
              className="absolute w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:hidden"
              key={`process-mobile-line-${index}`}
              style={{ height: segment.height, left: segment.left, top: segment.top }}
            />
          ))}
          {processDesktopLineSegments.map((segment, index) => (
            <span
              className="absolute hidden w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:block"
              key={`process-desktop-line-${index}`}
              style={{ height: segment.height, left: segment.left, top: segment.top }}
            />
          ))}

          <div className="flex flex-col gap-12">
            {steps.map((item, index) => {
              const iconSizeClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
              const iconMaskClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
              const iconSrc = item.iconImage || FALLBACK_PROCESS_ICONS[index];
              return (
                <article
                  className="grid items-start grid-cols-[40px_1fr] gap-6 md:grid-cols-[48px_1fr]"
                  data-tina-field={tinaField(item.raw)}
                  key={`${item.title}-${index}`}
                >
                  <div className="relative z-10 flex justify-center">
                    <div className={`flex items-center justify-center bg-[var(--cp-brand-neutral-50)] ${iconMaskClass}`}>
                      {iconSrc ? (
                        <FallbackImg
                          alt=""
                          aria-hidden
                          className={`${iconSizeClass} object-contain`}
                          data-tina-field={tinaField(item.raw, "iconImage")}
                          src={iconSrc}
                          variant="thumb"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-[var(--font-red-hat-display)] text-[20px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
                      data-tina-field={tinaField(item.raw, "title")}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)]"
                      data-tina-field={tinaField(item.raw, "description")}
                    >
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
