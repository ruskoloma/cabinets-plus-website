"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import ContactUsSection from "@/components/home/ContactUsSection";
import FillImage from "@/components/ui/FillImage";
import {
  getProjectDescription,
  getProjectGalleryAlt,
  getProjectGalleryField,
  getProjectHeading,
  getProjectSlug,
} from "./helpers";
import type { ProjectDetailPageProps } from "./types";

function CloseIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MaterialCard({
  label,
  title,
  subtitle,
  image,
  href,
  tinaField,
}: {
  label: string;
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
  tinaField?: string;
}) {
  const content = (
    <>
      <div className="relative h-20 w-20 overflow-hidden bg-[var(--cp-primary-100)]" data-tina-field={tinaField}>
        {image ? <FillImage alt={title} className="object-cover" sizes="80px" src={image} /> : null}
      </div>
      <div className="min-w-0">
        <p className="font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 break-words text-[14px] leading-[1.2] text-[var(--cp-primary-300)] md:text-[16px]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[180px_282px] md:items-center md:gap-x-[210px] md:gap-y-0">
      <p className="font-[var(--font-red-hat-display)] text-[24px] leading-none text-[var(--cp-primary-500)] md:w-[180px]">
        {label}
      </p>
      {href ? (
        <Link className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6 transition-opacity hover:opacity-80" href={href}>
          {content}
        </Link>
      ) : (
        <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6">
          {content}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage({
  project,
  galleryItems,
  materialCards,
  relatedProjects,
  contactBlock,
}: ProjectDetailPageProps) {
  const currentSlug = getProjectSlug(project, "project");
  const heading = getProjectHeading(project, currentSlug);
  const description = getProjectDescription(project);
  const rawProject = project as unknown as Record<string, unknown>;
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const activeGalleryItem = useMemo(
    () => (activeGalleryIndex === null ? null : galleryItems[activeGalleryIndex] || null),
    [activeGalleryIndex, galleryItems],
  );

  useEffect(() => {
    if (activeGalleryIndex === null) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveGalleryIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeGalleryIndex]);

  return (
    <div className="bg-white">
      <section className="bg-white">
        <div className="cp-container px-4 pb-12 pt-[35px] md:px-8 md:pb-[88px] md:pt-[88px]">
          <div className="max-w-[1376px]">
            <div className="flex max-w-[1376px] flex-col gap-4 text-[var(--cp-primary-500)] md:gap-7">
              <h1
                className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
                data-tina-field={tinaField(rawProject, "title") || undefined}
              >
                {heading}
              </h1>

              {description ? (
                <p
                  className="max-w-[1376px] whitespace-pre-line text-[18px] leading-[1.5] md:text-[24px]"
                  data-tina-field={tinaField(rawProject, "description") || undefined}
                >
                  {description}
                </p>
              ) : null}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:mt-8 md:grid-cols-4 md:gap-7">
              {galleryItems.map((item, index) => (
                <button
                  className="relative aspect-square overflow-hidden bg-[var(--cp-primary-100)]"
                  data-tina-field={getProjectGalleryField(project, item, tinaField)}
                  key={`${item.file}-${index}`}
                  onClick={() => setActiveGalleryIndex(index)}
                  type="button"
                >
                  <FillImage alt={getProjectGalleryAlt(project, item)} className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" src={item.file} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {materialCards.length > 0 ? (
        <section className="bg-[var(--cp-brand-neutral-50)]">
          <div className="cp-container px-4 py-[72px] md:px-[149px] md:pb-[63px] md:pt-16">
            <div className="md:flex md:items-start md:gap-[175px]">
              <h2 className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:w-[177px] md:text-[32px]">
                Finish & Materials
              </h2>

              <div className="mt-10 md:mt-0 md:w-[790px] md:border-l md:border-[var(--cp-primary-500)] md:pl-[117px]">
                <div className="flex flex-col gap-10 md:gap-6">
                  {materialCards.map((card) => (
                    <MaterialCard
                      href={card.href}
                      image={card.image}
                      key={`${card.kind}-${card.title}`}
                      label={card.label}
                      subtitle={card.subtitle}
                      tinaField={card.tinaField}
                      title={card.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white">
        <div className="cp-container px-4 py-[72px] md:px-8 md:py-16">
          <h2 className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]">
            Projects You Might Like
          </h2>

          <div className="cp-hide-scrollbar mt-10 flex snap-x gap-5 overflow-x-auto md:mt-8 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible">
            {relatedProjects.map((item) => (
              <Link
                className="block w-[294px] shrink-0 snap-start overflow-hidden bg-[var(--cp-primary-100)] transition-opacity hover:opacity-90 md:w-auto"
                data-tina-field={item.tinaField}
                href={`/projects/${item.slug}`}
                key={item.slug}
              >
                <div className="relative h-[215px] w-full md:h-[330px]">
                  <FillImage alt={item.title} className="object-cover" sizes="(min-width: 768px) 33vw, 294px" src={item.image} />
                </div>
                <span className="sr-only">{item.title}</span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-center md:mt-8">
            <Button className="!h-12 !px-8 !text-[20px]" href="/gallery" size="small" variant="outline">
              View all
            </Button>
          </div>
        </div>
      </section>

      {contactBlock ? <ContactUsSection block={contactBlock} /> : null}

      {activeGalleryItem ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setActiveGalleryIndex(null)}
          role="dialog"
        >
          <button
            aria-label="Close preview"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--cp-primary-500)] transition hover:bg-white"
            onClick={() => setActiveGalleryIndex(null)}
            type="button"
          >
            <CloseIcon />
          </button>

          <div className="max-h-[90vh] max-w-[min(95vw,1200px)]" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-[min(85vh,900px)] w-[min(95vw,1100px)]">
              <FillImage
                alt={getProjectGalleryAlt(project, activeGalleryItem)}
                className="rounded-[4px] object-contain"
                sizes="95vw"
                src={activeGalleryItem.file}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="sr-only" data-current-project={currentSlug} />
    </div>
  );
}
