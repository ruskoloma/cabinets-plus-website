"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import ContactUsSection from "@/components/home/ContactUsSection";
import Button from "@/components/ui/Button";
import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import {
  EMPTY_GALLERY_FILTERS,
  filterGalleryProjects,
  parseGalleryQueryState,
  serializeMultiValue,
  toggleMultiValue,
  type GalleryFilterState,
} from "./filtering";
import { buildGalleryProjects } from "./normalize-gallery-overview-query";
import type { CatalogVisualOption, GalleryOverviewDataShape } from "./types";

const PAGE_SIZE = 18;
const ROOM_VISUALS: Record<string, string> = {
  kitchen: "/library/gallery/filter-room-kitchen.png",
  bathroom: "/library/gallery/filter-room-bathroom.png",
  laundry: "/library/gallery/filter-room-laundry.png",
  other: "/library/gallery/filter-room-other.png",
};

type OpenPanel = "room" | "doorStyle" | "finish" | "countertop" | null;
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
      className={`flex h-8 w-8 items-center justify-center border text-[14px] font-semibold leading-[1.4] transition-colors ${
        active
          ? "border-2 border-[var(--cp-primary-500)] bg-[var(--cp-primary-500)] text-white"
          : disabled
            ? "border-[var(--cp-primary-100)] text-[var(--cp-primary-300)]"
            : "border-[var(--cp-primary-500)] text-[var(--cp-primary-500)] hover:bg-[var(--cp-brand-neutral-50)]"
      }`}
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
  onMouseEnter,
  onMouseLeave,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <button
      className={`inline-flex items-center gap-[9px] text-[20px] leading-none text-[var(--cp-primary-500)] transition-opacity md:text-[24px] ${
        active ? "opacity-100" : disabled ? "cursor-not-allowed opacity-40" : "opacity-95 hover:opacity-70"
      }`}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      type="button"
    >
      <span>{label}</span>
      <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
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
      className="inline-flex h-8 items-center gap-[6px] border border-[var(--cp-primary-500)] pl-3 pr-2 text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
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
  onMouseEnter,
  onMouseLeave,
  onChange,
}: {
  checked: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onChange: () => void;
}) {
  return (
    <button className="inline-flex items-center gap-4" onClick={onChange} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} type="button">
      <span
        className={`flex h-6 w-[42px] items-center rounded-full border border-[var(--cp-primary-100)] bg-white px-[3px] transition-colors md:h-8 md:w-14 md:px-1 ${
          checked ? "justify-end" : "justify-start"
        }`}
      >
        <span className="h-[18px] w-[18px] rounded-full bg-[var(--cp-primary-300)] md:h-6 md:w-6" />
      </span>
      <span className="font-[var(--font-red-hat-display)] text-[20px] leading-none text-[var(--cp-primary-500)] md:text-[24px]">
        Flooring Projects Only
      </span>
    </button>
  );
}

function PanelShell({
  children,
  onMouseEnter,
  onMouseLeave,
  title,
}: {
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  title: string;
}) {
  return (
    <div
      className="mt-5 border border-[var(--cp-primary-100)] bg-white p-5 shadow-[0_8px_12px_6px_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)] md:absolute md:left-0 md:right-0 md:top-full md:z-30 md:mt-3 md:p-8"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <h2 className="text-center font-[var(--font-red-hat-display)] text-[24px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function RoomOptionCard({
  image,
  label,
  selected,
  onClick,
}: {
  image: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button className="group flex flex-col items-center gap-[9px]" onClick={onClick} type="button">
      <span className="relative block h-[132px] w-[132px] overflow-hidden bg-[#f2f2f2] md:h-[177px] md:w-[177px]">
        <img alt={label} className="h-full w-full object-cover" src={image} />
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
    <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
      <span className="font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-white">Select</span>
    </span>
  );
}

function DoorStyleOptionCard({
  option,
  selected,
  onClick,
}: {
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button className="group flex flex-col items-center gap-3" onClick={onClick} type="button">
      <span className="relative block h-[120px] w-[120px] overflow-hidden bg-[#f2f2f2] md:h-[160px] md:w-[160px]">
        {option.image ? <img alt={option.label} className="h-full w-full object-contain" src={option.image} /> : null}
        <OverlayOptionState selected={selected} />
      </span>
      <span className="font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.35] text-[var(--cp-primary-500)] md:text-[18px]">
        {option.label}
      </span>
    </button>
  );
}

function CountertopOptionCard({
  option,
  selected,
  onClick,
}: {
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  const hasImage = Boolean(option.image);

  return (
    <button className="group flex flex-col items-center gap-[9px]" onClick={onClick} type="button">
      <span className="relative flex h-[132px] w-[132px] items-center justify-center overflow-hidden bg-[#f2f2f2] md:h-[177px] md:w-[177px]">
        {hasImage ? (
          <span className="block h-[90px] w-[90px] overflow-hidden md:h-[120px] md:w-[120px]">
            <img alt={option.label} className="h-full w-full object-cover" src={option.image || ""} />
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
  option,
  selected,
  onClick,
}: {
  option: CatalogVisualOption;
  selected: boolean;
  onClick: () => void;
}) {
  const swatchColor = option.swatchColor?.trim();
  const hasCustomImage = Boolean(option.image);
  const swatchStyle = !hasCustomImage && swatchColor ? { backgroundColor: swatchColor } : undefined;
  const needsBorder = !hasCustomImage && (!swatchColor || ["#ffffff", "#faf9f6"].includes(swatchColor.toLowerCase()));

  return (
    <button className="group flex flex-col items-center gap-3" onClick={onClick} type="button">
      <span
        className={`relative block h-[96px] w-[96px] overflow-hidden ${needsBorder ? "border border-[var(--cp-primary-100)]" : ""} md:h-[112px] md:w-[112px]`}
        style={swatchStyle}
      >
        {hasCustomImage ? <img alt={option.label} className="h-full w-full object-contain" src={option.image || ""} /> : null}
        <OverlayOptionState selected={selected} />
      </span>
      <span className="font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.35] text-[var(--cp-primary-500)] md:text-[18px]">
        {option.label}
      </span>
    </button>
  );
}

export default function GalleryOverviewPage({
  contactBlock,
  data,
}: {
  contactBlock?: Record<string, unknown> | null;
  data: GalleryOverviewDataShape;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/gallery";
  const liveSearchParams = useSearchParams();
  const resolvedSearchParams = useMemo(
    () => new URLSearchParams(liveSearchParams?.toString() || ""),
    [liveSearchParams],
  );
  const queryState = useMemo(() => parseGalleryQueryState(resolvedSearchParams), [resolvedSearchParams]);
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
  const projects = useMemo(() => buildGalleryProjects(data), [data]);
  const filteredProjects = useMemo(() => filterGalleryProjects(projects, selectedFilters), [projects, selectedFilters]);
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
  const closePanelTimeoutRef = useRef<number | null>(null);

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

  const clearPanelCloseTimeout = useCallback(() => {
    if (closePanelTimeoutRef.current) {
      window.clearTimeout(closePanelTimeoutRef.current);
      closePanelTimeoutRef.current = null;
    }
  }, []);

  const schedulePanelClose = useCallback(
    (panel: OpenPanel) => {
      if (!panel) return;
      clearPanelCloseTimeout();
      closePanelTimeoutRef.current = window.setTimeout(() => {
        setOpenPanel((current) => (current === panel ? null : current));
        closePanelTimeoutRef.current = null;
      }, 60);
    },
    [clearPanelCloseTimeout],
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
    if (!openPanel || openPanel === "room") return;
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
    clearPanelCloseTimeout();
    setOpenPanel(panel);
  }, [clearPanelCloseTimeout, selectedFilters, stainValueSet]);

  const toggleFilter = useCallback((panel: Exclude<OpenPanel, null>) => {
    if (selectedFilters.flooringOnly && panel !== "room") {
      return;
    }

    if (openPanel === panel) {
      clearPanelCloseTimeout();
      setOpenPanel(null);
      return;
    }

    openFilter(panel);
  }, [clearPanelCloseTimeout, openFilter, openPanel]);

  function applyOpenPanel() {
    updateFilters(pendingFilters);
    setOpenPanel(null);
  }

  useEffect(() => {
    setPendingFilters(selectedFilters);
  }, [selectedFilters]);

  useEffect(() => {
    return () => {
      clearPanelCloseTimeout();
    };
  }, [clearPanelCloseTimeout]);

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

  useEffect(() => {
    if (queryState.page === currentPage) return;
    updatePage(currentPage);
  }, [currentPage, queryState.page, updatePage]);

  return (
    <div className="bg-white" suppressHydrationWarning>
      <section className="bg-white">
        <div className="cp-container px-4 pb-16 pt-14 md:px-8 md:pb-[88px] md:pt-[88px]">
          <h1 className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]">
            Gallery
          </h1>

          <div className="mt-4 flex flex-col gap-5 md:mt-12 md:gap-8">
            <div className="relative" ref={filtersRef}>
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="order-2 flex flex-col gap-5 md:order-1 md:gap-8">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 md:gap-x-10">
                  <FilterTrigger
                    active={openPanel === "room"}
                    label="Room"
                    onClick={() => toggleFilter("room")}
                    onMouseEnter={() => openFilter("room")}
                    onMouseLeave={() => schedulePanelClose("room")}
                  />
                  <FilterTrigger
                    active={openPanel === "doorStyle"}
                    disabled={selectedFilters.flooringOnly}
                    label="Door Style"
                    onClick={() => toggleFilter("doorStyle")}
                    onMouseEnter={selectedFilters.flooringOnly ? undefined : () => openFilter("doorStyle")}
                    onMouseLeave={() => schedulePanelClose("doorStyle")}
                  />
                  <FilterTrigger
                    active={openPanel === "finish"}
                    disabled={selectedFilters.flooringOnly}
                    label="Finish"
                    onClick={() => toggleFilter("finish")}
                    onMouseEnter={selectedFilters.flooringOnly ? undefined : () => openFilter("finish")}
                    onMouseLeave={() => schedulePanelClose("finish")}
                  />
                  <FilterTrigger
                    active={openPanel === "countertop"}
                    disabled={selectedFilters.flooringOnly}
                    label="Countertop"
                    onClick={() => toggleFilter("countertop")}
                    onMouseEnter={selectedFilters.flooringOnly ? undefined : () => openFilter("countertop")}
                    onMouseLeave={() => schedulePanelClose("countertop")}
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

              <div className="order-1 flex items-center justify-between gap-6 md:order-2 md:justify-end md:gap-10">
                <p className="font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)]">
                  <span>Showing </span>
                  <span className="font-bold">{totalResults} results</span>
                </p>
                <button className="inline-flex items-center gap-2 text-[16px] leading-none text-[var(--cp-primary-500)]" type="button">
                  <span>
                    Sort by <span className="font-bold">New</span>
                  </span>
                  <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                </button>
              </div>
            </div>

            {openPanel === "room" ? (
              <PanelShell
                onMouseEnter={clearPanelCloseTimeout}
                onMouseLeave={() => schedulePanelClose("room")}
                title="Select Room"
              >
                <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:mt-[52px] md:gap-10">
                  {roomOptions.map((option) => {
                    const normalized = normalizeOptionValue(option.value);
                    const image = ROOM_VISUALS[normalized] || ROOM_VISUALS.other;
                    const selected = pendingFilters.room === normalized;

                    return (
                      <RoomOptionCard
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
              <PanelShell
                onMouseEnter={clearPanelCloseTimeout}
                onMouseLeave={() => schedulePanelClose("doorStyle")}
                title="Select door style"
              >
                <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:gap-8">
                  {doorStyles.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.doorStyles.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                        <DoorStyleOptionCard
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
              <PanelShell
                onMouseEnter={clearPanelCloseTimeout}
                onMouseLeave={() => schedulePanelClose("finish")}
                title="Select finish"
              >
                <div className="mt-6 flex items-start justify-center gap-8">
                  <button
                    className={`flex flex-col items-center gap-0.5 font-[var(--font-red-hat-display)] text-[20px] font-semibold uppercase tracking-[0.01em] ${
                      finishTab === "paint" ? "text-[var(--cp-primary-500)]" : "text-[var(--cp-primary-500)]/80"
                    }`}
                    onClick={() => setFinishTab("paint")}
                    type="button"
                  >
                    <span>Paint</span>
                    <span className={`h-0.5 w-full ${finishTab === "paint" ? "bg-[var(--cp-primary-500)]" : "bg-transparent"}`} />
                  </button>
                  <button
                    className={`flex flex-col items-center gap-0.5 font-[var(--font-red-hat-display)] text-[20px] font-semibold uppercase tracking-[0.01em] ${
                      finishTab === "stain" ? "text-[var(--cp-primary-500)]" : "text-[var(--cp-primary-500)]/80"
                    }`}
                    onClick={() => setFinishTab("stain")}
                    type="button"
                  >
                    <span>Stain</span>
                    <span className={`h-0.5 w-full ${finishTab === "stain" ? "bg-[var(--cp-primary-500)]" : "bg-transparent"}`} />
                  </button>
                </div>
                <div className="mt-8 flex flex-wrap items-start justify-center gap-4 md:gap-6">
                  {(finishTab === "paint" ? paintOptions : stainTypes).map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.finishes.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                        <FinishOptionCard
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
              <PanelShell
                onMouseEnter={clearPanelCloseTimeout}
                onMouseLeave={() => schedulePanelClose("countertop")}
                title="Select countertop"
              >
                <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:mt-[52px] md:gap-10">
                  {countertopOptions.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFilters.countertops.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                        <CountertopOptionCard
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
                <button
                  className="text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
                  onClick={() => {
                    setPendingFilters(EMPTY_GALLERY_FILTERS);
                    updateFilters(EMPTY_GALLERY_FILTERS);
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>

          {visibleProjects.length ? (
            <div className="mt-8 grid grid-cols-3 gap-3 md:mt-7 md:gap-7">
              {visibleProjects.map((project, index) => (
                <Link
                  className="aspect-square overflow-hidden bg-[#f2f2f2] md:aspect-[4/3]"
                  data-tina-field={
                    project.previewMedia && Object.keys(project.previewMedia.rawMedia).length > 0
                      ? tinaField(project.previewMedia.rawMedia, "file")
                      : tinaField(project.rawProject, "primaryPicture")
                  }
                  href={`/projects/${project.projectSlug}`}
                  key={`${project.projectSlug}-${index}`}
                >
                  <img alt={project.projectTitle} className="h-full w-full object-cover" src={project.previewImage} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-[var(--cp-primary-100)] px-6 py-10 text-center md:mt-7">
              <p className="font-[var(--font-red-hat-display)] text-[20px] text-[var(--cp-primary-500)]">
                No projects match these filters yet.
              </p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-2 md:mt-12">
              <PaginationButton
                disabled={currentPage <= 1}
                onClick={() => updatePage(Math.max(1, currentPage - 1))}
              >
                <img alt="" aria-hidden className="h-4 w-4 rotate-180" src="/library/header/nav-chevron-right.svg" />
              </PaginationButton>

              {visiblePages.map((page) => (
                <PaginationButton
                  active={page === currentPage}
                  key={`page-${page}`}
                  onClick={() => updatePage(page)}
                >
                  {page}
                </PaginationButton>
              ))}

              <PaginationButton
                disabled={currentPage >= totalPages}
                onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
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
