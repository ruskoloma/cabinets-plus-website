"use client";

import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import ProjectMosaic from "@/components/home/ProjectMosaic";
import { resolveHomepageSectionImageOptions } from "@/lib/homepage-image-controls";
import { asText, type BlockRecord } from "./block-types";

const FALLBACK_PROJECT_IMAGES = [
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-main.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-2.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-3.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-4.jpg",
  "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-5.jpg",
];

export default function ProjectsSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const imageOptions = resolveHomepageSectionImageOptions(record);
  const gallery = (Array.isArray(block.images) ? (block.images as unknown[]) : [])
    .map((item) => asText(item))
    .filter(Boolean);
  const projectImages = gallery.length > 0 ? gallery : FALLBACK_PROJECT_IMAGES;
  const imageFields = gallery.map((_, index) => tinaField(record, `images.${index}`));

  return (
    <section className="bg-[var(--cp-brand-neutral-50)] px-0 py-12 md:py-16" data-tina-field={tinaField(record)} id="projects">
      <div className="cp-container px-4 md:px-8">
        <h2
          className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
          data-tina-field={tinaField(record, "title")}
        >
          {asText(block.title, "Our projects")}
        </h2>
        <ProjectMosaic
          imageFields={imageFields}
          imageVariant={imageOptions.useOriginal ? null : imageOptions.variant}
          images={projectImages}
        />
        <div className="mt-12 text-center md:mt-7">
          <Button
            className="!min-h-12 md:!min-h-14"
            dataTinaField={tinaField(record, "ctaLabel")}
            href={asText(block.ctaLink, "/gallery")}
            variant="outline"
          >
            {asText(block.ctaLabel, "View All projects")}
          </Button>
        </div>
      </div>
    </section>
  );
}
