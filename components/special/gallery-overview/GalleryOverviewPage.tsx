"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import ContactUsSection from "@/components/shared/ContactUsSection";
import FillImage from "@/components/ui/FillImage";
import Button from "@/components/ui/Button";
import ClearFiltersButton from "@/components/ui/ClearFiltersButton";
import CatalogSortDropdown from "@/components/special/catalog-overview/CatalogSortDropdown";
import { usePaginationScrollTarget } from "@/components/special/catalog-overview/use-pagination-scroll";
import CatalogMobileFilterOverlay from "@/components/special/cabinets-overview/CatalogMobileFilterOverlay";
import { DoorStyleOptionCard as SharedDoorStyleOptionCard, FinishOptionCard as SharedFinishOptionCard } from "@/components/special/cabinets-overview/CatalogFilterOptionCards";
import { normalizeOptionValue } from "@/components/special/cabinets-overview/normalize-cabinets-overview-query";
import { normalizeImageSizeChoice, resolveConfiguredImageVariant, type ImageSizeChoice } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import {
  EMPTY_GALLERY_FILTERS,
  filterGalleryProjects,
  parseGalleryQueryState,
  serializeMultiValue,
  toggleMultiValue,
  type GalleryFilterState,
} from "./filtering";
import { buildGalleryCollections, buildGalleryProjects } from "./normalize-gallery-overview-query";
import GallerySpecialitySection from "./GallerySpecialitySection";
import type { CatalogVisualOption, GalleryOverviewDataShape } from "./types";

const PAGE_SIZE = 18;
const ROOM_VISUALS: Record<string, string> = {
  kitchen: "/library/gallery/filter-room-kitchen.png",
  bathroom: "/library/gallery/filter-room-bathroom.png",
  laundry: "/library/gallery/filter-room-laundry.png",
  other: "/library/gallery/filter-room-other.png",
};
const SORT_OPTIONS = [
  { value: "az", label: "Projects (A-Z)" },
  { value: "za", label: "Projects (Z-A)" },
  { value: "new", label: "New" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type OpenPanel = "room" | "doorStyle" | "finish" | "countertop" | "sort" | null;
type FinishTab = "paint" | "stain";
function toReadableLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getVisiblePages(totalPages: number, page: number): number[] {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(1, page - 1);
  const end = Math.min(totalPages, start + 2);

  if (end - start < 2) {
    start = Math.max(1, end - 2);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function PaginationButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`cp-pagination-button ${active ? "cp-pagination-button--active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FilterTrigger({
  active,
  disabled,
  label,
  onClick,
  className = "",
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`cp-inline-trigger cp-inline-trigger--display ${className || "cp-inline-trigger--large"} ${active ? "text-[var(--cp-primary-500)]" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <img alt="" aria-hidden className="cp-inline-trigger__icon rotate-90" src="/library/header/nav-chevron-right.svg" />
    </button>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      className="cp-filter-chip"
      onClick={onRemove}
      type="button"
    >
      <span>{label}</span>
      <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-close.svg" />
    </button>
  );
}

function FlooringToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button className="inline-flex shrink-0 items-center gap-4" onClick={onChange} type="button">
      <span
        className={`flex h-6 w-[42px] items-center rounded-full border border-[var(--cp-primary-100)] bg-white px-[3px] transition-colors md:h-8 md:w-14 md:px-1 ${
          checked ? "justify-end" : "justify-start"
        }`}
      >
        <span className="h-[18px] w-[18px] rounded-full bg-[var(--cp-primary-300)] md:h-6 md:w-6" />
      </span>
      <span className="whitespace-nowrap font-[var(--font-red-hat-display)] text-[20px] leading-none text-[var(--cp-primary-500)] md:text-[24px]">
        Flooring Projects Only
      </span>
    </button>
  );
}

function PanelShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="mt-5 border border-[var(--cp-primary-100)] bg-white p-5 shadow-[0_8px_12px_6px_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)] md:absolute md:left-0 md:right-0 md:top-full md:z-30 md:mt-3 md:p-8">
      <h2 className="text-center font-[var(--font-red-hat-display)] text-[24px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function RoomOptionCard({
  imageVariant,
  image,
  label,
  selected,
  onClick,
}: {
  imageVariant?: ImageVariantPreset;
  image: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button className="group flex w-full flex-col items-center gap-[9px]" onClick={onClick} type="button">
      <span className="relative block aspect-square w-full max-w-[173px] overflow-hidden bg-[#f2f2f2] md:max-w-[177px]">
        <FillImage
          alt={label}
          className="object-cover"
          sizes="(max-width: 392px) calc((100vw - 47px) / 2), 177px"
          src={image}
          variant={imageVariant}
        />
        <OverlayOptionState selected={selected} />
      </span>
      <span className="font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]">
        {label}
      </span>
    </button>
  );
}

function OverlayOptionState({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cp-brand-neutral-300)]">
          <img alt="" aria-hidden="true" className="h-6 w-6" src="/library/catalog/filter-card-selected-check.svg" />
        </span>
      </span>
    );
  }

  return (
    <span className="absolute inset-0 hidden items-center justify-center bg-black/25 opacity-0 transition-opacity md:flex md:group-hover:opacity-100">
      <span className="font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-white">Select</span>
    </span>
  );
}

function DoorStyleOptionCard({
  imageSizeChoice,
  option,
  selected,
  onClick,
}: {
  imageSizeChoice?: ImageSizeChoice;
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  return <SharedDoorStyleOptionCard imageSizeChoice={imageSizeChoice} onClick={onClick} option={option} selected={selected} />;
}

function CountertopOptionCard({
  imageVariant,
  option,
  selected,
  onClick,
}: {
  imageVariant?: ImageVariantPreset;
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  const hasImage = Boolean(option.image);

  return (
    <button className="group flex w-full flex-col items-center gap-[9px]" onClick={onClick} type="button">
      <span className="relative flex aspect-square w-full max-w-[173px] items-center justify-center overflow-hidden bg-[#f2f2f2] md:max-w-[177px]">
        {hasImage ? (
          <span className="relative block aspect-square w-[67.05%] overflow-hidden">
            <FillImage
              alt={option.label}
              className="object-cover"
              sizes="(max-width: 392px) calc(((100vw - 47px) / 2) * 0.6705), 120px"
              src={option.image || ""}
              variant={imageVariant}
            />
          </span>
        ) : (
          <span className="px-4 text-center font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.25] text-[var(--cp-primary-500)]/70">
            {option.label}
          </span>
        )}
        <OverlayOptionState selected={selected} />
      </span>
      <span className="font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]">
        {option.label}
      </span>
    </button>
  );
}

function FinishOptionCard({
  imageSizeChoice,
  option,
  selected,
  onClick,
}: {
  imageSizeChoice?: ImageSizeChoice;
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  return <SharedFinishOptionCard imageSizeChoice={imageSizeChoice} onClick={onClick} option={option} selected={selected} />;
}

function GalleryProjectCard({
  href,
  image,
  imageVariant,
  tinaFieldValue,
  title,
}: {
  href: string;
  image: string;
  imageVariant?: ImageVariantPreset;
  tinaFieldValue?: string;
  title: string;
}) {
  return (
    <Link className="group flex flex-col items-start" data-tina-field={tinaFieldValue} href={href}>
      <span className="relative block h-[173px] w-full overflow-hidden bg-[#f2f2f2] md:h-[330px]">
        <FillImage
          alt={title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(min-width: 768px) 33vw, calc((100vw - 47px) / 2)"
          src={image}
          variant={imageVariant}
        />
      </span>
      <span className="mt-2 flex w-full items-start justify-between gap-2 md:mt-[14px]">
        <span className="min-w-0 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
          {title}
        </span>
        <img
          alt=""
          aria-hidden
          className="mt-[1px] h-4 w-4 shrink-0 md:hidden"
          src="/library/header/nav-chevron-right.svg"
        />
      </span>
    </Link>
  );
}

export default function GalleryOverviewPage({
  contactBlock,
  data,
  filterImageSizeChoice,
  pageSettingsRecord,
  pageTitle,
  projectCardImageSizeChoice,
}: {
  contactBlock?: Record<string, unknown> | null;
  data: GalleryOverviewDataShape;
  filterImageSizeChoice?: string | null;
  pageSettingsRecord?: Record<string, unknown> | null;
  pageTitle?: string | null;
  projectCardImageSizeChoice?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/gallery";
  const liveSearchParams = useSearchParams();
  const resolvedSearchParams = useMemo(
    () => new URLSearchParams(liveSearchParams?.toString() || ""),
    [liveSearchParams],
  );
  const queryState = useMemo(() => parseGalleryQueryState(resolvedSearchParams), [resolvedSearchParams]);
  const sortValue = useMemo<SortValue>(() => {
    const rawSort = normalizeOptionValue(resolvedSearchParams.get("sort") || "");
    return SORT_OPTIONS.some((option) => option.value === rawSort) ? (rawSort as SortValue) : "new";
  }, [resolvedSearchParams]);
  const baseSelectedFilters = useMemo<GalleryFilterState>(
    () => ({
      room: queryState.room,
      doorStyles: queryState.doorStyles,
      finishes: queryState.finishes,
      countertops: queryState.countertops,
      flooringOnly: queryState.flooringOnly,
    }),
    [queryState.countertops, queryState.doorStyles, queryState.finishes, queryState.flooringOnly, queryState.room],
  );
  const selectedFilters = useMemo<GalleryFilterState>(
    () =>
      baseSelectedFilters.flooringOnly
        ? {
            ...baseSelectedFilters,
            doorStyles: [],
            finishes: [],
            countertops: [],
          }
        : baseSelectedFilters,
    [baseSelectedFilters],
  );
  const normalizedFilterImageSizeChoice = normalizeImageSizeChoice(filterImageSizeChoice, "thumb");
  const galleryProjectCardImageVariant = resolveConfiguredImageVariant(projectCardImageSizeChoice, "card");
  const galleryFilterImageVariant = resolveConfiguredImageVariant(filterImageSizeChoice, "thumb");
  const projects = useMemo(() => buildGalleryProjects(data), [data]);
  const collections = useMemo(() => buildGalleryCollections(data), [data]);
  const specialityTitle = useMemo(() => {
    const value = pageSettingsRecord?.specialityTitle;
    return typeof value === "string" && value.trim().length > 0 ? value : "Speciality";
  }, [pageSettingsRecord]);
  const specialityEnabled = useMemo(() => {
    const value = pageSettingsRecord?.specialityEnabled;
    if (value === false) return false;
    return true;
  }, [pageSettingsRecord]);
  const specialityImageSizeChoice = useMemo(() => {
    const value = pageSettingsRecord?.specialityCardImageSize;
    return typeof value === "string" ? value : null;
  }, [pageSettingsRecord]);
  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortValue)?.label || "New",
    [sortValue],
  );
  const filteredProjects = useMemo(() => {
    const rankedProjects = filterGalleryProjects(projects, selectedFilters);

    if (sortValue === "az") {
      return [...rankedProjects].sort((left, right) => left.projectTitle.localeCompare(right.projectTitle));
    }

    if (sortValue === "za") {
      return [...rankedProjects].sort((left, right) => right.projectTitle.localeCompare(left.projectTitle));
    }

    return rankedProjects;
  }, [projects, selectedFilters, sortValue]);
  const totalResults = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(Math.max(queryState.page, 1), totalPages);
  const visibleProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredProjects]);
  const visiblePages = useMemo(() => getVisiblePages(totalPages, currentPage), [currentPage, totalPages]);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [pendingFilters, setPendingFilters] = useState<GalleryFilterState>(selectedFilters);
  const [finishTab, setFinishTab] = useState<FinishTab>("paint");
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const projectsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const { scrollToTarget: scrollToResultsTop } = usePaginationScrollTarget(projectsHeadingRef);

  const roomOptions = useMemo(
    () =>
      (data.catalogSettings?.rooms || []).map((room) => ({
        label: room,
        value: normalizeOptionValue(room),
      })),
    [data.catalogSettings?.rooms],
  );
  const doorStyles = useMemo(() => data.catalogSettings?.doorStyles || [], [data.catalogSettings?.doorStyles]);
  const paintOptions = useMemo(() => data.catalogSettings?.paintOptions || [], [data.catalogSettings?.paintOptions]);
  const stainTypes = useMemo(() => data.catalogSettings?.stainTypes || [], [data.catalogSettings?.stainTypes]);
  const countertopOptions = useMemo(
    () => data.catalogSettings?.countertopTypes || [],
    [data.catalogSettings?.countertopTypes],
  );

  const roomMap = useMemo(() => new Map(roomOptions.map((option) => [option.value, option.label])), [roomOptions]);
  const doorStyleMap = useMemo(
    () => new Map(doorStyles.map((option) => [normalizeOptionValue(option.value), option.label])),
    [doorStyles],
  );
  const paintMap = useMemo(
    () => new Map(paintOptions.map((option) => [normalizeOptionValue(option.value), option.label])),
    [paintOptions],
  );
  const stainMap = useMemo(
    () => new Map(stainTypes.map((option) => [normalizeOptionValue(option.value), option.label])),
    [stainTypes],
  );
  const countertopMap = useMemo(
    () => new Map(countertopOptions.map((option) => [normalizeOptionValue(option.value), option.label])),
    [countertopOptions],
  );
  const stainValueSet = useMemo(
    () => new Set(stainTypes.map((option) => normalizeOptionValue(option.value))),
    [stainTypes],
  );

  const updateQuery = useCallback((patch: Record<string, string | null>, resetPage = false) => {
    const nextParams = new URLSearchParams(resolvedSearchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (!value || !value.trim()) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    if (resetPage && !Object.prototype.hasOwnProperty.call(patch, "page")) {
      nextParams.set("page", "1");
    }

    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, resolvedSearchParams, router]);

  const updateFilters = useCallback((nextFilters: GalleryFilterState) => {
    const normalizedFilters = nextFilters.flooringOnly
      ? {
          ...nextFilters,
          doorStyles: [],
          finishes: [],
          countertops: [],
        }
      : nextFilters;

    updateQuery(
      {
        room: normalizedFilters.room || null,
        doorStyle: serializeMultiValue(normalizedFilters.doorStyles),
        finish: serializeMultiValue(normalizedFilters.finishes),
        countertop: serializeMultiValue(normalizedFilters.countertops),
        flooring: normalizedFilters.flooringOnly ? "1" : null,
      },
      true,
    );
  }, [updateQuery]);

  useEffect(() => {
    if (!baseSelectedFilters.flooringOnly) return;
    if (!openPanel || openPanel === "room" || openPanel === "sort") return;
    setOpenPanel(null);
  }, [baseSelectedFilters.flooringOnly, openPanel]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{
      key: string;
      group: "room" | "doorStyle" | "finish" | "countertop" | "flooring";
      value: string;
      label: string;
    }> = [];

    if (selectedFilters.room) {
      chips.push({
        key: `room:${selectedFilters.room}`,
        group: "room",
        value: selectedFilters.room,
        label: roomMap.get(selectedFilters.room) || toReadableLabel(selectedFilters.room),
      });
    }

    for (const value of selectedFilters.doorStyles) {
      chips.push({
        key: `doorStyle:${value}`,
        group: "doorStyle",
        value,
        label: doorStyleMap.get(value) || toReadableLabel(value),
      });
    }

    for (const value of selectedFilters.finishes) {
      chips.push({
        key: `finish:${value}`,
        group: "finish",
        value,
        label: paintMap.get(value) || stainMap.get(value) || toReadableLabel(value),
      });
    }

    for (const value of selectedFilters.countertops) {
      chips.push({
        key: `countertop:${value}`,
        group: "countertop",
        value,
        label: countertopMap.get(value) || toReadableLabel(value),
      });
    }

    if (selectedFilters.flooringOnly) {
      chips.push({
        key: "flooring:true",
        group: "flooring",
        value: "true",
        label: "Flooring Projects Only",
      });
    }

    return chips;
  }, [countertopMap, doorStyleMap, paintMap, roomMap, selectedFilters, stainMap]);

  const hasSelectedFilters = activeFilterChips.length > 0;

  const openFilter = useCallback((panel: Exclude<OpenPanel, null>) => {
    if (selectedFilters.flooringOnly && panel !== "room") {
      return;
    }

    setPendingFilters(selectedFilters);
    if (panel === "finish") {
      const hasSelectedStains = selectedFilters.finishes.some((value) => stainValueSet.has(value));
      const hasSelectedPaints = selectedFilters.finishes.some((value) => !stainValueSet.has(value));
      setFinishTab(hasSelectedStains && !hasSelectedPaints ? "stain" : "paint");
    }
    setOpenPanel(panel);
  }, [selectedFilters, stainValueSet]);

  const toggleFilter = useCallback((panel: Exclude<OpenPanel, null>) => {
    if (selectedFilters.flooringOnly && panel !== "room") {
      return;
    }

    if (openPanel === panel) {
      setOpenPanel(null);
      return;
    }

    openFilter(panel);
  }, [openFilter, openPanel, selectedFilters.flooringOnly]);

  function applyOpenPanel() {
    updateFilters(pendingFilters);
    setOpenPanel(null);
  }

  useEffect(() => {
    setPendingFilters(selectedFilters);
  }, [selectedFilters]);

  useEffect(() => {
    if (!openPanel) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!filtersRef.current) return;
      if (!filtersRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openPanel]);

  const updatePage = useCallback((nextPage: number) => {
    updateQuery({ page: nextPage <= 1 ? null : String(nextPage) });
  }, [updateQuery]);

  const handlePageChange = useCallback((nextPage: number) => {
    if (nextPage === currentPage) return;
    updatePage(nextPage);
    scrollToResultsTop();
  }, [currentPage, scrollToResultsTop, updatePage]);

  useEffect(() => {
    if (queryState.page === currentPage) return;
    updatePage(currentPage);
  }, [currentPage, queryState.page, updatePage]);

  return (
    <div className="bg-white" suppressHydrationWarning>
      <section className="bg-white">
        <div className="cp-container px-4 pb-16 pt-14 md:px-8 md:pb-[88px] md:pt-[88px]">
          <h1
            className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
            data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "pageTitle") || undefined : undefined}
          >
            {pageTitle || "Gallery"}
          </h1>

          <GallerySpecialitySection
            block={pageSettingsRecord || null}
            collections={collections}
            enabled={specialityEnabled}
            imageSizeChoice={specialityImageSizeChoice}
            title={specialityTitle}
          />

          <h2
            className="mt-10 text-[28px] uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:mt-12 md:text-[32px]"
            ref={projectsHeadingRef}
          >
            Projects
          </h2>

          <div className="mt-6 flex flex-col gap-5 md:mt-8 md:gap-8">
            <div className="relative" ref={filtersRef}>
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="order-2 flex flex-col gap-5 md:order-1 md:gap-8">
                  <div className="-mx-4 flex items-center gap-10 overflow-x-auto px-4 cp-hide-scrollbar md:hidden">
                    <FilterTrigger
                      active={openPanel === "room"}
                      className="shrink-0 cp-inline-trigger--large"
                      label="Room"
                      onClick={() => toggleFilter("room")}
                    />
                    <FlooringToggle
                      checked={selectedFilters.flooringOnly}
                      onChange={() => {
                        const nextFlooringOnly = !selectedFilters.flooringOnly;
                        setOpenPanel(null);
                        updateFilters({
                          ...selectedFilters,
                          flooringOnly: nextFlooringOnly,
                          doorStyles: [],
                          finishes: [],
                          countertops: [],
                        });
                      }}
                    />
                  </div>

                  <div className="-mx-4 flex items-center gap-10 overflow-x-auto px-4 cp-hide-scrollbar md:hidden">
                    <FilterTrigger
                      active={openPanel === "doorStyle"}
                      className="shrink-0 text-[18px]"
                      disabled={selectedFilters.flooringOnly}
                      label="Door Style"
                      onClick={() => toggleFilter("doorStyle")}
                    />
                    <FilterTrigger
                      active={openPanel === "countertop"}
                      className="shrink-0 text-[18px]"
                      disabled={selectedFilters.flooringOnly}
                      label="Countertop"
                      onClick={() => toggleFilter("countertop")}
                    />
                    <FilterTrigger
                      active={openPanel === "finish"}
                      className="shrink-0 text-[18px]"
                      disabled={selectedFilters.flooringOnly}
                      label="Finish"
                      onClick={() => toggleFilter("finish")}
                    />
                  </div>

                  <div className="hidden flex-wrap items-center gap-x-10 gap-y-4 md:flex">
                    <FilterTrigger
                      active={openPanel === "room"}
                      label="Room"
                      onClick={() => toggleFilter("room")}
                    />
                    <FilterTrigger
                      active={openPanel === "doorStyle"}
                      disabled={selectedFilters.flooringOnly}
                      label="Door Style"
                      onClick={() => toggleFilter("doorStyle")}
                    />
                    <FilterTrigger
                      active={openPanel === "finish"}
                      disabled={selectedFilters.flooringOnly}
                      label="Finish"
                      onClick={() => toggleFilter("finish")}
                    />
                    <FilterTrigger
                      active={openPanel === "countertop"}
                      disabled={selectedFilters.flooringOnly}
                      label="Countertop"
                      onClick={() => toggleFilter("countertop")}
                    />
                    <FlooringToggle
                      checked={selectedFilters.flooringOnly}
                      onChange={() => {
                        const nextFlooringOnly = !selectedFilters.flooringOnly;

                        setOpenPanel(null);

                        updateFilters({
                          ...selectedFilters,
                          flooringOnly: nextFlooringOnly,
                          doorStyles: [],
                          finishes: [],
                          countertops: [],
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="order-1 flex items-center justify-between gap-6 md:hidden">
                  <p className="font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)]">
                    <span>Showing </span>
                    <span className="font-bold">{totalResults} results</span>
                  </p>
                  <div className="relative">
                    <button
                      className="cp-inline-trigger cp-inline-trigger--display"
                      onClick={() => setOpenPanel((current) => (current === "sort" ? null : "sort"))}
                      type="button"
                    >
                      <span>
                        Sort by <span className="font-bold">{sortLabel}</span>
                      </span>
                      <img
                        alt=""
                        aria-hidden
                        className={`cp-inline-trigger__icon transition-transform ${openPanel === "sort" ? "-rotate-90" : "rotate-90"}`}
                        src="/library/header/nav-chevron-right.svg"
                      />
                    </button>

                    {openPanel === "sort" ? (
                      <div className="absolute right-0 top-full z-30 mt-3 min-w-[184px] bg-white p-4 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)]">
                        <div className="flex flex-col gap-3">
                          {SORT_OPTIONS.map((option) => {
                            const selected = sortValue === option.value;

                            return (
                              <button
                                className={`text-left font-[var(--font-jost)] text-[16px] leading-[1.2] text-[var(--cp-gray-1)] transition-colors ${
                                  selected ? "font-semibold text-[var(--cp-primary-500)]" : "hover:text-[var(--cp-primary-350)]"
                                }`}
                                key={`gallery-mobile-sort-${option.value}`}
                                onClick={() => {
                                  updateQuery({ sort: option.value }, true);
                                  setOpenPanel(null);
                                }}
                                type="button"
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="order-1 hidden items-center justify-between gap-6 md:order-2 md:flex md:justify-end md:gap-10">
                  <p className="font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)]">
                    <span>Showing </span>
                    <span className="font-bold">{totalResults} results</span>
                  </p>
                  <CatalogSortDropdown
                    isOpen={openPanel === "sort"}
                    onOpen={() => setOpenPanel((current) => (current === "sort" ? null : "sort"))}
                    onSelect={(value) => {
                      updateQuery({ sort: value }, true);
                      setOpenPanel(null);
                    }}
                    options={SORT_OPTIONS}
                    selectedLabel={sortLabel}
                    selectedValue={sortValue}
                  />
                </div>
              </div>

            {openPanel === "room" ? (
              <PanelShell title="Select Room">
                <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:mt-[52px] md:gap-10">
                  {roomOptions.map((option) => {
                    const normalized = normalizeOptionValue(option.value);
                    const image = ROOM_VISUALS[normalized] || ROOM_VISUALS.other;
                    const selected = pendingFilters.room === normalized;

                    return (
                      <RoomOptionCard
                        imageVariant={galleryFilterImageVariant}
                        image={image}
                        key={option.value}
                        label={option.label}
                        onClick={() => setPendingFilters((current) => ({ ...current, room: current.room === normalized ? "" : normalized }))}
                        selected={selected}
                      />
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button className="!h-12 !px-8 !text-[20px]" onClick={applyOpenPanel} size="small" variant="outline">
                    Apply
                  </Button>
                </div>
              </PanelShell>
            ) : null}

            {openPanel === "doorStyle" ? (
              <PanelShell title="Select door style">
                <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:gap-10">
                  {doorStyles.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.doorStyles.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                        <DoorStyleOptionCard
                          imageSizeChoice={normalizedFilterImageSizeChoice}
                          onClick={() =>
                            setPendingFilters((current) => ({
                              ...current,
                              doorStyles: toggleMultiValue(current.doorStyles, value),
                            }))
                          }
                          option={option}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button className="!h-12 !px-8 !text-[20px]" onClick={applyOpenPanel} size="small" variant="outline">
                    Apply
                  </Button>
                </div>
              </PanelShell>
            ) : null}

            {openPanel === "finish" ? (
              <PanelShell title="Select finish">
                <div className="mt-6 flex items-start justify-center gap-8">
                  <button
                    className={`cp-tab-button text-[20px] ${finishTab === "paint" ? "cp-tab-button--active" : ""}`}
                    onClick={() => setFinishTab("paint")}
                    type="button"
                  >
                    <span>Paint</span>
                  </button>
                  <button
                    className={`cp-tab-button text-[20px] ${finishTab === "stain" ? "cp-tab-button--active" : ""}`}
                    onClick={() => setFinishTab("stain")}
                    type="button"
                  >
                    <span>Stain</span>
                  </button>
                </div>
                <div className="mt-8 flex flex-wrap items-start justify-center gap-4 md:gap-[14px]">
                  {(finishTab === "paint" ? paintOptions : stainTypes).map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.finishes.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                        <FinishOptionCard
                          imageSizeChoice={normalizedFilterImageSizeChoice}
                          onClick={() =>
                            setPendingFilters((current) => ({
                              ...current,
                              finishes: toggleMultiValue(current.finishes, value),
                            }))
                          }
                          option={option}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button className="!h-12 !px-8 !text-[20px]" onClick={applyOpenPanel} size="small" variant="outline">
                    Apply
                  </Button>
                </div>
              </PanelShell>
            ) : null}

            {openPanel === "countertop" ? (
              <PanelShell title="Select countertop">
                <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:mt-[52px] md:gap-10">
                  {countertopOptions.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.countertops.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                        <CountertopOptionCard
                          imageVariant={galleryFilterImageVariant}
                          onClick={() =>
                            setPendingFilters((current) => ({
                              ...current,
                              countertops: toggleMultiValue(current.countertops, value),
                            }))
                          }
                          option={option}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button className="!h-12 !px-8 !text-[20px]" onClick={applyOpenPanel} size="small" variant="outline">
                    Apply
                  </Button>
                </div>
              </PanelShell>
            ) : null}

            <CatalogMobileFilterOverlay onApply={applyOpenPanel} onClose={() => setOpenPanel(null)} open={openPanel === "room"} title="Select Room">
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-8">
                {roomOptions.map((option) => {
                  const normalized = normalizeOptionValue(option.value);
                  const image = ROOM_VISUALS[normalized] || ROOM_VISUALS.other;
                  const selected = pendingFilters.room === normalized;

                  return (
                    <RoomOptionCard
                      imageVariant={galleryFilterImageVariant}
                      image={image}
                      key={`mobile-room-${option.value}`}
                      label={option.label}
                      onClick={() => setPendingFilters((current) => ({ ...current, room: current.room === normalized ? "" : normalized }))}
                      selected={selected}
                    />
                  );
                })}
              </div>
            </CatalogMobileFilterOverlay>

            <CatalogMobileFilterOverlay onApply={applyOpenPanel} onClose={() => setOpenPanel(null)} open={openPanel === "doorStyle"} title="Select door style">
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-8">
                {doorStyles.map((option, index) => {
                  const value = normalizeOptionValue(option.value);
                  const selected = pendingFilters.doorStyles.includes(value);

                  return (
                    <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`gallery-mobile-door-style-${option.value}-${index}`}>
                      <DoorStyleOptionCard
                        imageSizeChoice={normalizedFilterImageSizeChoice}
                        onClick={() =>
                          setPendingFilters((current) => ({
                            ...current,
                            doorStyles: toggleMultiValue(current.doorStyles, value),
                          }))
                        }
                        option={option}
                        selected={selected}
                      />
                    </div>
                  );
                })}
              </div>
            </CatalogMobileFilterOverlay>

            <CatalogMobileFilterOverlay
              onApply={applyOpenPanel}
              onClose={() => setOpenPanel(null)}
              open={openPanel === "finish"}
              tabs={
                <div className="flex items-start gap-8">
                  <button
                    className={`cp-tab-button !font-[var(--font-red-hat-display)] !font-semibold !leading-[1.5] tracking-[0.18px] text-[18px] ${finishTab === "paint" ? "cp-tab-button--active" : ""}`}
                    onClick={() => setFinishTab("paint")}
                    type="button"
                  >
                    <span>PAINT</span>
                  </button>
                  <button
                    className={`cp-tab-button !font-[var(--font-red-hat-display)] !font-semibold !leading-[1.5] tracking-[0.18px] text-[18px] ${finishTab === "stain" ? "cp-tab-button--active" : ""}`}
                    onClick={() => setFinishTab("stain")}
                    type="button"
                  >
                    <span>STAIN</span>
                  </button>
                </div>
              }
              title="Select finish"
            >
              {finishTab === "paint" ? (
                <div className="grid grid-cols-3 gap-x-[15px] gap-y-8">
                  {paintOptions.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.finishes.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`gallery-mobile-paint-${option.value}-${index}`}>
                        <FinishOptionCard
                          imageSizeChoice={normalizedFilterImageSizeChoice}
                          onClick={() =>
                            setPendingFilters((current) => ({
                              ...current,
                              finishes: toggleMultiValue(current.finishes, value),
                            }))
                          }
                          option={option}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  {stainTypes.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.finishes.includes(value);

                    return (
                      <div
                        className="w-full max-w-[173px]"
                        data-tina-field={tinaField(option as unknown as Record<string, unknown>)}
                        key={`gallery-mobile-stain-${option.value}-${index}`}
                      >
                        <SharedDoorStyleOptionCard
                          imageSizeChoice={normalizedFilterImageSizeChoice}
                          onClick={() =>
                            setPendingFilters((current) => ({
                              ...current,
                              finishes: toggleMultiValue(current.finishes, value),
                            }))
                          }
                          option={option}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CatalogMobileFilterOverlay>

            <CatalogMobileFilterOverlay onApply={applyOpenPanel} onClose={() => setOpenPanel(null)} open={openPanel === "countertop"} title="Select countertop">
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-8">
                {countertopOptions.map((option, index) => {
                  const value = normalizeOptionValue(option.value);
                  const selected = pendingFilters.countertops.includes(value);

                  return (
                    <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`gallery-mobile-countertop-${option.value}-${index}`}>
                      <CountertopOptionCard
                        imageVariant={galleryFilterImageVariant}
                        onClick={() =>
                          setPendingFilters((current) => ({
                            ...current,
                            countertops: toggleMultiValue(current.countertops, value),
                          }))
                        }
                        option={option}
                        selected={selected}
                      />
                    </div>
                  );
                })}
              </div>
            </CatalogMobileFilterOverlay>
            </div>

            {hasSelectedFilters ? (
              <div className="flex flex-wrap items-center gap-[14px]">
                {activeFilterChips.map((chip) => (
                  <FilterChip
                    key={chip.key}
                    label={chip.label}
                    onRemove={() => {
                      if (chip.group === "room") {
                        updateFilters({ ...selectedFilters, room: "" });
                        return;
                      }

                      if (chip.group === "doorStyle") {
                        updateFilters({
                          ...selectedFilters,
                          doorStyles: selectedFilters.doorStyles.filter((value) => value !== chip.value),
                        });
                        return;
                      }

                      if (chip.group === "finish") {
                        updateFilters({
                          ...selectedFilters,
                          finishes: selectedFilters.finishes.filter((value) => value !== chip.value),
                        });
                        return;
                      }

                      if (chip.group === "countertop") {
                        updateFilters({
                          ...selectedFilters,
                          countertops: selectedFilters.countertops.filter((value) => value !== chip.value),
                        });
                        return;
                      }

                      updateFilters({
                        ...selectedFilters,
                        flooringOnly: false,
                      });
                    }}
                  />
                ))}
                <ClearFiltersButton
                  onClick={() => {
                    setPendingFilters(EMPTY_GALLERY_FILTERS);
                    updateFilters(EMPTY_GALLERY_FILTERS);
                  }}
                >
                  Clear filters
                </ClearFiltersButton>
              </div>
            ) : null}
          </div>

          {visibleProjects.length ? (
            <div className="mt-[23px] grid grid-cols-2 gap-x-[15px] gap-y-8 md:mt-8 md:grid-cols-3 md:gap-x-7 md:gap-y-7">
              {visibleProjects.map((project, index) => (
                <GalleryProjectCard
                  href={`/projects/${project.projectSlug}`}
                  image={project.previewImage}
                  imageVariant={galleryProjectCardImageVariant}
                  key={`${project.projectSlug}-${index}`}
                  tinaFieldValue={tinaField(project.rawProject, "title") || undefined}
                  title={project.projectTitle}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 border border-[var(--cp-primary-100)] px-6 py-10 text-center md:mt-7">
              <p className="font-[var(--font-red-hat-display)] text-[20px] text-[var(--cp-primary-500)]">
                No projects match these filters yet.
              </p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-2 md:mt-12">
              <PaginationButton
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              >
                <img alt="" aria-hidden className="h-4 w-4 rotate-180" src="/library/header/nav-chevron-right.svg" />
              </PaginationButton>

              {visiblePages.map((page) => (
                <PaginationButton
                  active={page === currentPage}
                  key={`page-${page}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PaginationButton>
              ))}

              <PaginationButton
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              >
                <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-chevron-right.svg" />
              </PaginationButton>
            </div>
          ) : null}
        </div>
      </section>

      {contactBlock ? <ContactUsSection block={contactBlock} /> : null}
    </div>
  );
}
