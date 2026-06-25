"use client";

import { tinaField } from "tinacms/dist/react";
import type { ProcessItem } from "@/app/figma-home.helpers";
import FallbackImg from "@/components/ui/FallbackImg";

interface ProcessTimelineProps {
  fallbackIcons: string[];
  items: ProcessItem[];
  keyPrefix?: string;
}

export default function ProcessTimeline({
  fallbackIcons,
  items,
  keyPrefix = "process",
}: ProcessTimelineProps) {
  return (
    <div className="relative mx-auto mt-12 w-full max-w-[361px] md:max-w-[1018px]">
      <div className="flex flex-col gap-12">
        {items.map((item, index) => {
          const iconSizeClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
          const iconMaskClass = index < 2 ? "h-10 w-10 md:h-12 md:w-12" : "h-8 w-8 md:h-12 md:w-12";
          const iconSrc = item.iconImage || fallbackIcons[index] || fallbackIcons[0];
          return (
            <article
              className="relative grid items-start grid-cols-[40px_1fr] gap-6 md:grid-cols-[48px_1fr]"
              data-tina-field={tinaField(item.raw as Record<string, unknown>)}
              key={`${keyPrefix}-${item.title}-${index}`}
            >
              {index < items.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[19px] top-[66px] h-[calc(100%_-_35px)] w-[2px] rounded-[2px] bg-[var(--cp-primary-100)] md:left-[23px] md:top-[65px] md:h-[calc(100%_-_34px)]"
                />
              ) : null}
              <div className="relative z-10 flex justify-center">
                <div className={`flex items-center justify-center ${iconMaskClass}`}>
                  {iconSrc ? (
                    <FallbackImg
                      alt=""
                      aria-hidden
                      className={`${iconSizeClass} object-contain`}
                      data-tina-field={tinaField(item.raw as Record<string, unknown>, "iconImage")}
                      src={iconSrc}
                      variant="thumb"
                    />
                  ) : null}
                </div>
              </div>
              <div>
                <h3
                  className="font-[var(--font-red-hat-display)] text-[20px] font-normal leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]"
                  data-tina-field={tinaField(item.raw as Record<string, unknown>, "title")}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-2 text-base leading-[1.5] text-[var(--cp-primary-500)]"
                  data-tina-field={tinaField(item.raw as Record<string, unknown>, "description")}
                >
                  {item.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
