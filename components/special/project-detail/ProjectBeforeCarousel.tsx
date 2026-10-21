"use client";

import { useEffect, useId, useRef, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import type { ProjectMediaItem, ProjectOverviewItem } from "./types";

interface ProjectBeforeCarouselProps {
  images: Array<ProjectMediaItem | null>;
  project: ProjectOverviewItem;
}

export default function ProjectBeforeCarousel({ images, project }: ProjectBeforeCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const trackId = useId();
  const headingId = useId();
  const [bounds, setBounds] = useState({ previous: false, next: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function updateBounds() {
      if (!track) return;
      const previous = track.scrollLeft > 1;
      const next = track.scrollLeft + track.clientWidth < track.scrollWidth - 1;
      setBounds((current) => current.previous === previous && current.next === next ? current : { previous, next });
    }

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(track);
    track.addEventListener("scroll", updateBounds, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", updateBounds);
    };
  }, [images]);

  function scroll(direction: number) {
    const track = trackRef.current;
    const firstSlide = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstSlide) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (firstSlide.offsetWidth + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section aria-labelledby={headingId} aria-roledescription="carousel" className="mt-10 md:mt-12">
      <div className="mb-5 flex items-center justify-between gap-4 md:mb-7">
        <h2 className="text-[24px] uppercase leading-[1.25] text-[var(--cp-primary-500)] md:text-[32px]" id={headingId}>
          Before
        </h2>
        {images.length > 1 ? (
          <div className="flex gap-2">
            {(["previous", "next"] as const).map((direction) => (
              <button
                aria-controls={trackId}
                aria-label={`${direction === "previous" ? "Previous" : "Next"} before photos`}
                className={`cp-arrow-button cp-arrow-button--secondary disabled:cursor-default ${!bounds[direction] ? "cp-arrow-button--disabled" : ""}`}
                disabled={!bounds[direction]}
                key={direction}
                onClick={() => scroll(direction === "previous" ? -1 : 1)}
                type="button"
              >
                <svg aria-hidden="true" className={`h-6 w-6 ${direction === "previous" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        aria-label="Before remodel photos"
        className="cp-hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cp-primary-400)] md:gap-7"
        id={trackId}
        ref={trackRef}
        role="group"
        tabIndex={0}
      >
        {images.map((image, index) => (
          <figure
            aria-label={`${index + 1} of ${images.length}`}
            aria-roledescription="slide"
            className="relative aspect-[11/5] w-[85%] shrink-0 snap-start overflow-hidden bg-[var(--cp-primary-100)] md:w-[calc((100%-56px)/3)]"
            data-tina-field={image?.raw ? tinaField(image.raw, "file") || undefined : undefined}
            key={`${image?.file}-${index}`}
            role="group"
          >
            <FillImage
              alt={image?.label?.trim() || image?.description?.trim() || `${project.title || "Project"} before remodel, photo ${index + 1}`}
              className="object-cover"
              sizes="(min-width: 1440px) 440px, (min-width: 768px) 33vw, 85vw"
              src={image?.file}
              variant="card"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
