"use client";

import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import ContactUsSection from "@/components/home/ContactUsSection";
import {
  getProjectDescription,
  getProjectGalleryAlt,
  getProjectGalleryField,
  getProjectHeading,
  getProjectSlug,
} from "./helpers";
import type { ProjectDetailPageProps } from "./types";

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
      <div className="h-20 w-20 overflow-hidden bg-[var(--cp-primary-100)]" data-tina-field={tinaField}>
        {image ? <img alt={title} className="h-full w-full object-cover" src={image} /> : null}
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
                <div
                  className="aspect-square overflow-hidden bg-[var(--cp-primary-100)]"
                  data-tina-field={getProjectGalleryField(project, item, tinaField)}
                  key={`${item.file}-${index}`}
                >
                  <img alt={getProjectGalleryAlt(project, item)} className="h-full w-full object-cover" src={item.file} />
                </div>
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
                <img alt={item.title} className="h-[215px] w-full object-cover md:h-[330px]" src={item.image} />
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

      <div className="sr-only" data-current-project={currentSlug} />
    </div>
  );
}
