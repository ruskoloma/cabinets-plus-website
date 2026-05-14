"use client";

import Link from "next/link";
import { useMemo } from "react";
import { tinaField, useEditState } from "tinacms/dist/react";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import {
  focusTinaSidebarListItem,
  TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME,
} from "@/lib/tina-list-focus";
import { useTinaQuickEditEnabled } from "@/lib/use-tina-quick-edit-enabled";
import { buildMaterialCards, type MaterialCardsConfig } from "./helpers";
import type {
  CabinetListItem,
  CountertopListItem,
  FlooringListItem,
  ProjectMaterialCardData,
  ProjectOverviewItem,
} from "./types";

function readStringField(block: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!block) return null;
  const value = block[key];
  return typeof value === "string" ? value : null;
}

function MaterialCard({
  title,
  subtitle,
  image,
  imageVariant,
  href,
  focusItemId,
  focusListKey,
  focusRootFieldName,
  quickEditEnabled,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  imageVariant?: ImageVariantPreset;
  href?: string;
  focusItemId?: string;
  focusListKey?: string;
  focusRootFieldName?: string;
  quickEditEnabled: boolean;
}) {
  const { edit } = useEditState();
  // In Tina edit mode we always intercept the click to focus the PROJECT document in the
  // sidebar (via `field:selected` on the project root) and scroll to the specific list row.
  // We deliberately do not set `data-tina-field` on the card so Tina's native click handler
  // does not navigate into the linked cabinet/countertop/flooring document.
  const useCustomFocus = Boolean(edit && quickEditEnabled && focusListKey);
  const className = useCustomFocus
    ? `grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6 transition-opacity hover:opacity-80 ${TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME}`
    : "grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6 transition-opacity hover:opacity-80";
  const content = (
    <>
      <div className="relative h-20 w-20 overflow-hidden bg-[var(--cp-primary-100)]">
        {image ? <FillImage alt={title} className="object-cover" sizes="80px" src={image} variant={imageVariant} /> : null}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-2">
          <p className="min-w-0 truncate font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]">
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

  const handleCustomFocusClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!edit) return;

    event.preventDefault();
    event.stopPropagation();

    if (!focusListKey) return;

    focusTinaSidebarListItem({
      rootFieldName: focusRootFieldName,
      listKey: focusListKey,
      itemId: focusItemId,
    });
  };

  return href ? (
    <Link className={className} href={href} onClick={handleCustomFocusClick}>
      {content}
    </Link>
  ) : (
    <div
      className={useCustomFocus ? className : "grid grid-cols-[80px_minmax(0,1fr)] items-center gap-6"}
      onClick={useCustomFocus ? handleCustomFocusClick : undefined}
    >
      {content}
    </div>
  );
}

function MaterialGroup({
  label,
  items,
  imageVariant,
  focusRootFieldName,
  quickEditEnabled,
}: {
  label: string;
  items: ProjectMaterialCardData[];
  imageVariant?: ImageVariantPreset;
  focusRootFieldName?: string;
  quickEditEnabled: boolean;
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
            quickEditEnabled={quickEditEnabled}
            subtitle={card.subtitle}
            title={card.title}
          />
        ))}
      </div>
    </div>
  );
}

interface ProjectMaterialsSectionProps {
  block?: Record<string, unknown> | null;
  project: ProjectOverviewItem;
  cabinetIndex: CabinetListItem[];
  countertopIndex: CountertopListItem[];
  flooringIndex: FlooringListItem[];
}

export default function ProjectMaterialsSection({
  block,
  project,
  cabinetIndex,
  countertopIndex,
  flooringIndex,
}: ProjectMaterialsSectionProps) {
  const quickEditEnabled = useTinaQuickEditEnabled();
  const rawProject = project as unknown as Record<string, unknown>;
  const projectFieldName = tinaField(rawProject) || undefined;

  const titleText = (readStringField(block, "title") || "").trim() || "Finish & Materials";
  const imageSizeChoice = readStringField(block, "imageSize");
  const materialCardImageVariant: ImageVariantPreset | undefined = resolveConfiguredImageVariant(imageSizeChoice, "thumb");

  const cabinetTitle = readStringField(block, "cabinetTitle");
  const cabinetPlaceholder = readStringField(block, "cabinetPlaceholder");
  const countertopTitle = readStringField(block, "countertopTitle");
  const countertopPlaceholder = readStringField(block, "countertopPlaceholder");
  const flooringTitle = readStringField(block, "flooringTitle");
  const flooringPlaceholder = readStringField(block, "flooringPlaceholder");

  const materialsConfig = useMemo<MaterialCardsConfig>(
    () => ({
      cabinet: { label: cabinetTitle, placeholderImage: cabinetPlaceholder },
      countertop: { label: countertopTitle, placeholderImage: countertopPlaceholder },
      flooring: { label: flooringTitle, placeholderImage: flooringPlaceholder },
    }),
    [
      cabinetTitle,
      cabinetPlaceholder,
      countertopTitle,
      countertopPlaceholder,
      flooringTitle,
      flooringPlaceholder,
    ],
  );

  const materialCards = useMemo(
    () => buildMaterialCards(project, cabinetIndex, countertopIndex, tinaField, flooringIndex, materialsConfig),
    [project, cabinetIndex, countertopIndex, flooringIndex, materialsConfig],
  );

  const materialGroups = useMemo(() => {
    const groups: Array<{ kind: string; label: string; items: ProjectMaterialCardData[] }> = [];

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

  if (materialGroups.length === 0) return null;

  // No data-tina-field on the outer <section> or any card ancestor: we rely entirely on our
  // custom postMessage channel (focusTinaSidebarListItem) fired from the card onClick so Tina
  // focuses the PROJECT document and scrolls to the specific list row — instead of Tina's
  // native click handler walking up to any ancestor and focusing something else.
  return (
    <section className="bg-[var(--cp-brand-neutral-50)]">
      <div className="cp-container px-4 py-[72px] md:px-[149px] md:pb-[63px] md:pt-16">
        <div className="md:flex md:items-start md:gap-[175px]">
          <h2
            className="text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:w-[177px] md:text-[32px]"
            data-tina-field={block ? tinaField(block, "title") || undefined : undefined}
          >
            {titleText}
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
                  quickEditEnabled={quickEditEnabled}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
