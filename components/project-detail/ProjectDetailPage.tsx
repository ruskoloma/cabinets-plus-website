"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import Button from "@/components/ui/Button";
import ContactUsSection from "@/components/home/ContactUsSection";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import {
  focusTinaSidebarListItem,
  TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME,
} from "@/lib/tina-list-focus";
import { getTinaSidebarMediaItemId, TINA_FOCUS_PROJECT_MEDIA_MESSAGE } from "@/lib/tina-media-focus";
import {
  getProjectDescription,
  getProjectGalleryAlt,
  getProjectGalleryField,
  getProjectGalleryFocusField,
  getProjectHeading,
  getProjectSlug,
} from "./helpers";
import type { ProjectDetailPageProps } from "./types";

const TINA_MEDIA_FOCUS_RETRY_DELAYS_MS = [0, 120, 260, 480, 760, 1120];

function CloseIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function postMessageToTinaParent(message: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.parent || window.parent === window) return;
  window.parent.postMessage(message, "*");
}

function focusProjectMediaItemInSidebar(rootFieldName: string | undefined, mediaFile: string) {
  const itemId = getTinaSidebarMediaItemId(mediaFile);

  if (rootFieldName) {
    postMessageToTinaParent({ type: "field:selected", fieldName: rootFieldName });
  }

  if (!itemId) return;

  TINA_MEDIA_FOCUS_RETRY_DELAYS_MS.forEach((delay) => {
    window.setTimeout(() => {
      postMessageToTinaParent({
        type: TINA_FOCUS_PROJECT_MEDIA_MESSAGE,
        itemId,
      });
    }, delay);
  });
}

function MaterialCard({
  title,
  subtitle,
  image,
  imageVariant,
  href,
  tinaField,
  focusItemId,
  focusListKey,
  focusRootFieldName,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  imageVariant?: ImageVariantPreset;
  href?: string;
  tinaField?: string;
  focusItemId?: string;
  focusListKey?: string;
  focusRootFieldName?: string;
}) {
  const { edit } = useEditState();
  const useCustomFocus = Boolean(edit && focusListKey && focusItemId);
  const className = useCustomFocus
    ? `grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6 transition-opacity hover:opacity-80 ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
    : "grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6 transition-opacity hover:opacity-80";
  const content = (
    <>
      <div className="relative h-20 w-20 overflow-hidden bg-[var(--cp-primary-100)]">
        {image ? <FillImage alt={title} className="object-cover" sizes="80px" src={image} variant={imageVariant} /> : null}
      </div>
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <p className="font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]">
            {title}
          </p>
          {href ? <img alt="" aria-hidden className="mt-[2px] h-4 w-4 shrink-0 md:hidden" src="/library/header/nav-chevron-right.svg" /> : null}
        </div>
        {subtitle ? (
          <p className="mt-1 break-words text-[14px] leading-[1.2] text-[var(--cp-primary-300)] md:text-[16px]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    href ? (
      <Link
        className={className}
        data-tina-field={useCustomFocus ? undefined : tinaField}
        href={href}
        onClick={(event) => {
          if (!edit) return;

          event.preventDefault();

          if (!useCustomFocus || !focusListKey) return;

          focusTinaSidebarListItem({
            rootFieldName: focusRootFieldName,
            listKey: focusListKey,
            itemId: focusItemId,
          });
        }}
      >
        {content}
      </Link>
    ) : (
      <div
        className={useCustomFocus ? `${className}` : "grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6"}
        data-tina-field={useCustomFocus ? undefined : tinaField}
        onClick={
          useCustomFocus && focusListKey
            ? () =>
                focusTinaSidebarListItem({
                  rootFieldName: focusRootFieldName,
                  listKey: focusListKey,
                  itemId: focusItemId,
                })
            : undefined
        }
      >
        {content}
      </div>
    )
  );
}

function MaterialGroup({
  label,
  items,
  imageVariant,
  focusRootFieldName,
}: {
  label: string;
  items: ProjectDetailPageProps["materialCards"];
  imageVariant?: ImageVariantPreset;
  focusRootFieldName?: string;
}) {
  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[180px_282px] md:items-stretch md:gap-x-[210px] md:gap-y-0">
      <p className="font-[var(--font-red-hat-display)] text-[24px] leading-none text-[var(--cp-primary-500)] md:hidden">
        {label}
      </p>
      <div className="hidden md:flex md:w-[180px] md:items-center">
        <p className="font-[var(--font-red-hat-display)] text-[24px] leading-none text-[var(--cp-primary-500)]">
          {label}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {items.map((card, index) => (
          <MaterialCard
            focusItemId={card.focusItemId}
            focusListKey={card.focusListKey}
            focusRootFieldName={focusRootFieldName}
            href={card.href}
            image={card.image}
            imageVariant={imageVariant}
            key={`${card.kind}-${card.title}-${index}`}
            subtitle={card.subtitle}
            tinaField={card.tinaField}
            title={card.title}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({
  project,
  galleryItems,
  materialCards,
  relatedProjects,
  pageSettingsRecord,
  materialsTitle,
  relatedProjectsTitle,
  relatedProjectsCtaLabel,
  contactBlock,
  materialCardImageSizeChoice,
  galleryImageSizeChoice,
  lightboxImageSizeChoice,
  relatedProjectsImageSizeChoice,
}: ProjectDetailPageProps) {
  const { edit } = useEditState();
  const currentSlug = getProjectSlug(project, "project");
  const heading = getProjectHeading(project, currentSlug);
  const description = getProjectDescription(project);
  const rawProject = project as unknown as Record<string, unknown>;
  const projectFieldName = tinaField(rawProject) || undefined;
  const finishMaterialsTitleText = (materialsTitle || "").trim() || "Finish & Materials";
  const relatedProjectsTitleText = (relatedProjectsTitle || "").trim() || "Projects You Might Like";
  const relatedProjectsCtaText = (relatedProjectsCtaLabel || "").trim() || "View all";
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const materialCardImageVariant = resolveConfiguredImageVariant(materialCardImageSizeChoice, "thumb");
  const galleryGridImageVariant = resolveConfiguredImageVariant(galleryImageSizeChoice, "card");
  const lightboxImageVariant = resolveConfiguredImageVariant(lightboxImageSizeChoice, "full");
  const relatedProjectsImageVariant = resolveConfiguredImageVariant(relatedProjectsImageSizeChoice, "card");
  const activeGalleryItem = useMemo(
    () => (activeGalleryIndex === null ? null : galleryItems[activeGalleryIndex] || null),
    [activeGalleryIndex, galleryItems],
  );
  const materialGroups = useMemo(() => {
    const groups: Array<{ kind: string; label: string; items: typeof materialCards }> = [];

    materialCards.forEach((card) => {
      const existing = groups.find((group) => group.kind === card.kind);
      if (existing) {
        existing.items.push(card);
        return;
      }

      groups.push({
        kind: card.kind,
        label: card.label,
        items: [card],
      });
    });

    return groups;
  }, [materialCards]);
  const suppressMaterialsSectionQuickEdit = edit && materialCards.some((card) => Boolean(card.focusItemId && card.focusListKey));
  const suppressRelatedProjectsSectionQuickEdit = edit && relatedProjects.some((item) => Boolean(item.focusItemId && item.focusListKey));

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
      <section className="bg-white" data-tina-field={edit ? undefined : projectFieldName}>
        <div className="cp-container px-4 pb-12 pt-[35px] md:px-8 md:pb-[88px] md:pt-[88px]">
          <div className="max-w-[1376px]">
            <nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 flex-wrap items-center gap-1 text-[16px] leading-[1.2] text-[var(--cp-primary-300)] md:mb-7 md:text-[14px]">
              <Link className="transition-colors hover:text-[var(--cp-primary-350)]" href="/gallery">
                Gallery
              </Link>
              <span>/</span>
              <span data-tina-field={tinaField(rawProject, "slug") || undefined}>{heading}</span>
            </nav>

            <div className="flex max-w-[1376px] flex-col gap-4 text-[var(--cp-primary-500)] md:gap-7">
              <h1
                className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
                data-tina-field={tinaField(rawProject, "slug") || undefined}
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
              {galleryItems.map((item, index) => {
                const galleryField = getProjectGalleryField(project, item, tinaField);
                const galleryFocusField = getProjectGalleryFocusField(project, item, tinaField);
                const useCustomMediaFocus = edit && item.sourceType === "media";
                const buttonClassName = useCustomMediaFocus
                  ? "relative aspect-square overflow-hidden bg-[var(--cp-primary-100)] outline outline-2 outline-dashed outline-[rgba(34,150,254,0.45)] transition-[outline-color,box-shadow] duration-150 hover:outline-[rgba(34,150,254,1)] hover:shadow-[inset_0_0_0_9999px_rgba(34,150,254,0.28)]"
                  : "relative aspect-square overflow-hidden bg-[var(--cp-primary-100)]";

                return (
                  <button
                    className={buttonClassName}
                    data-tina-field={useCustomMediaFocus ? undefined : galleryField}
                    data-tinafield={galleryFocusField}
                    key={`${item.file}-${index}`}
                    onClick={() => {
                      if (useCustomMediaFocus) {
                        focusProjectMediaItemInSidebar(projectFieldName, item.file);
                        return;
                      }

                      setActiveGalleryIndex(index);
                    }}
                    type="button"
                  >
                  <FillImage alt={getProjectGalleryAlt(project, item)} className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" src={item.file} variant={galleryGridImageVariant} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {materialGroups.length > 0 ? (
        <section className="bg-[var(--cp-brand-neutral-50)]" data-tina-field={suppressMaterialsSectionQuickEdit ? undefined : tinaField(rawProject) || undefined}>
          <div className="cp-container px-4 py-[72px] md:px-[149px] md:pb-[63px] md:pt-16">
            <div className="md:flex md:items-start md:gap-[175px]">
              <h2
                className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:w-[177px] md:text-[32px]"
                data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectDetailMaterialsTitle") || undefined : undefined}
              >
                {finishMaterialsTitleText}
              </h2>

              <div className="mt-10 md:mt-0 md:w-[790px] md:border-l md:border-[var(--cp-primary-500)] md:pl-[117px]">
                <div className="flex flex-col gap-10 md:gap-6">
                  {materialGroups.map((group) => (
                    <MaterialGroup
                      focusRootFieldName={projectFieldName}
                      imageVariant={materialCardImageVariant}
                      items={group.items}
                      key={group.kind}
                      label={group.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white" data-tina-field={suppressRelatedProjectsSectionQuickEdit ? undefined : tinaField(rawProject) || undefined}>
        <div className="cp-container px-4 py-[72px] md:px-8 md:py-16">
          <h2
            className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]"
            data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectDetailRelatedProjectsTitle") || undefined : undefined}
          >
            {relatedProjectsTitleText}
          </h2>

          <div className="cp-hide-scrollbar mt-10 flex snap-x gap-5 overflow-x-auto md:mt-8 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible">
            {relatedProjects.map((item) => {
              const useCustomFocus = Boolean(edit && item.focusItemId && item.focusListKey);
              const className = useCustomFocus
                ? `group block w-[173px] shrink-0 snap-start transition-opacity hover:opacity-90 md:w-auto ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
                : "group block w-[173px] shrink-0 snap-start transition-opacity hover:opacity-90 md:w-auto";

              return (
                <Link
                  className={className}
                  data-tina-field={useCustomFocus ? undefined : item.tinaField}
                  href={`/projects/${item.slug}`}
                  key={item.slug}
                  onClick={(event) => {
                    if (!edit) return;

                    event.preventDefault();

                    if (!useCustomFocus || !item.focusListKey) return;

                    focusTinaSidebarListItem({
                      rootFieldName: projectFieldName,
                      listKey: item.focusListKey,
                      itemId: item.focusItemId,
                    });
                  }}
                >
                  <div className="relative h-[173px] w-full overflow-hidden bg-[var(--cp-primary-100)] md:h-[330px]">
                    <FillImage alt={item.title} className="object-cover" sizes="(min-width: 768px) 33vw, 173px" src={item.image} variant={relatedProjectsImageVariant} />
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-2 md:mt-3 md:block">
                    <p className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
                      {item.title}
                    </p>
                    <img alt="" aria-hidden className="mt-[1px] h-4 w-4 shrink-0 md:hidden" src="/library/header/nav-chevron-right.svg" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center md:mt-8">
            <Button
              className="!h-12 !px-8 !text-[20px]"
              dataTinaField={pageSettingsRecord ? tinaField(pageSettingsRecord, "projectDetailRelatedProjectsCtaLabel") || undefined : undefined}
              href="/gallery"
              size="small"
              variant="secondary"
            >
              {relatedProjectsCtaText}
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
                variant={lightboxImageVariant}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="sr-only" data-current-project={currentSlug} />
    </div>
  );
}
