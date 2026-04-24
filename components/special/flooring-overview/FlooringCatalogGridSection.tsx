"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tinaField, useEditState, useTina } from "tinacms/dist/react";
import { FLOORING_LIVE_QUERY } from "@/app/flooring-live-query";
import FillImage from "@/components/ui/FillImage";
import Button from "@/components/ui/Button";
import ClearFiltersButton from "@/components/ui/ClearFiltersButton";
import { formatProductCode } from "@/components/special/cabinet-door/helpers";
import CatalogSortDropdown from "@/components/special/catalog-overview/CatalogSortDropdown";
import { usePaginationScrollTarget } from "@/components/special/catalog-overview/use-pagination-scroll";
import { normalizeImageSizeChoice, resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import CatalogMobileFilterOverlay from "@/components/special/cabinets-overview/CatalogMobileFilterOverlay";
import {
  getOverviewFlooringItems,
  normalizeOptionValue,
} from "./normalize-flooring-overview-query";
import type { FlooringOverviewDataShape } from "./types";

const PAGE_SIZE = 16;
const SORT_OPTIONS = [
  { value: "az", label: "Products (A-Z)" },
  { value: "za", label: "Products (Z-A)" },
  { value: "new", label: "New" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type OpenPanel = "flooring" | "sort" | null;

interface QueryState {
  page: number;
  sort: SortValue;
  q: string;
  flooring: string[];
}

interface FlooringCardItem {
  raw: Record<string, unknown>;
  slug: string;
  name: string;
  code: string;
  picture: string;
  relativePath: string;
}

interface FlooringCatalogGridSectionProps {
  block?: Record<string, unknown> | null;
  data: FlooringOverviewDataShape;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? value : fallback;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^flooring\//i, "")
    .replace(/\s+/g, "-");
}

function toReadableLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseMultiValue(value: string | null): string[] {
  if (!value) return [];

  const seen = new Set<string>();
  const values: string[] = [];

  value
    .split(",")
    .map((item) => normalizeOptionValue(item))
    .filter(Boolean)
    .forEach((item) => {
      if (seen.has(item)) return;
      seen.add(item);
      values.push(item);
    });

  return values;
}

function serializeMultiValue(values: string[]): string | null {
  const normalized = parseMultiValue(values.join(","));
  return normalized.length ? normalized.join(",") : null;
}

function toggleMultiValue(values: string[], value: string): string[] {
  const normalizedValue = normalizeOptionValue(value);
  if (!normalizedValue) return values;

  if (values.includes(normalizedValue)) {
    return values.filter((item) => item !== normalizedValue);
  }

  return [...values, normalizedValue];
}

function parseQueryState(params: URLSearchParams): QueryState {
  const rawPage = Number(params.get("page") || "1");
  const sort = normalizeOptionValue(params.get("sort") || "");

  const normalizedSort: SortValue = SORT_OPTIONS.some((option) => option.value === sort)
    ? (sort as SortValue)
    : "new";

  return {
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    sort: normalizedSort,
    q: (params.get("q") || "").trim(),
    flooring: parseMultiValue(params.get("flooring")),
  };
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

function PanelShell({
  children,
  className = "",
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <div className={`border border-[var(--cp-primary-100)] bg-white p-5 shadow-[0_8px_12px_6px_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)] md:p-8 ${className}`.trim()}>
      <h2 className="text-center font-[var(--font-red-hat-display)] text-[24px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function FlooringOptionState({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cp-brand-neutral-300)]">
          <img alt="" aria-hidden="true" className="h-5 w-5" src="/library/catalog/filter-card-selected-check.svg" />
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

function FlooringOptionCard({
  imageVariant,
  option,
  selected,
  onClick,
}: {
  imageVariant?: ImageVariantPreset;
  option: { value: string; label: string; image?: string | null };
  selected: boolean;
  onClick: () => void;
}) {
  const record = option as unknown as Record<string, unknown>;

  return (
    <button className="group flex flex-col items-center gap-2" onClick={onClick} type="button">
      <span className="relative flex h-[173px] w-[173px] items-center justify-center overflow-hidden bg-[#f2f2f2]">
        {option.image ? (
          <span className="relative block h-[116px] w-[116px]" data-tina-field={tinaField(record, "image")}>
            <FillImage alt={option.label} className="object-cover object-center" sizes="116px" src={option.image} variant={imageVariant} />
          </span>
        ) : null}
        <FlooringOptionState selected={selected} />
      </span>
      <span
        className="w-full text-center font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)]"
        data-tina-field={tinaField(record, "label")}
      >
        {option.label}
      </span>
    </button>
  );
}

function PaginationButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
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

function StaticFlooringCard({
  item,
  imageVariant,
}: {
  item: FlooringCardItem;
  imageVariant?: ImageVariantPreset;
}) {
  return (
    <Link className="group block" href={`/flooring/catalog/${item.slug}`}>
      <span className="block aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
        {item.picture ? (
          <div className="relative h-full w-full">
            <FillImage
              alt={item.name}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              data-tina-field={tinaField(item.raw, "picture")}
              sizes="(min-width: 1280px) 279px, (min-width: 1024px) calc((100vw - 300px) / 4), (min-width: 768px) calc((100vw - 160px) / 3), calc((100vw - 47px) / 2)"
              src={item.picture}
              variant={imageVariant}
            />
          </div>
        ) : null}
      </span>
      <span className="mt-3 block max-w-[270px]">
        <span
          className="block font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]"
          data-tina-field={tinaField(item.raw, "name")}
        >
          {item.name}
        </span>
        {item.code ? (
          <span
            className="mt-2 block text-[16px] leading-none text-[var(--cp-primary-300)]"
            data-tina-field={tinaField(item.raw, "code")}
          >
            {formatProductCode(item.code)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function TinaFlooringCard({
  item,
  imageVariant,
}: {
  item: FlooringCardItem;
  imageVariant?: ImageVariantPreset;
}) {
  const initialData = useMemo(() => ({ flooring: item.raw }), [item.raw]);
  const variables = useMemo(() => ({ relativePath: item.relativePath }), [item.relativePath]);

  const { data } = useTina({
    data: initialData,
    query: FLOORING_LIVE_QUERY,
    variables,
  });

  const liveFlooring = data.flooring as Record<string, unknown> | null | undefined;
  const liveName = typeof liveFlooring?.name === "string" ? liveFlooring.name : item.name;
  const liveCode = typeof liveFlooring?.code === "string" ? liveFlooring.code : item.code;
  const livePicture = typeof liveFlooring?.picture === "string" ? liveFlooring.picture : item.picture;
  const liveSlug =
    typeof liveFlooring?.slug === "string" && liveFlooring.slug.trim().length > 0
      ? liveFlooring.slug
      : item.slug;

  return (
    <Link
      className="group block"
      data-tina-field={liveFlooring ? tinaField(liveFlooring, "name") || undefined : undefined}
      href={`/flooring/catalog/${liveSlug}`}
    >
      <span className="block aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
        {livePicture ? (
          <div className="relative h-full w-full">
            <FillImage
              alt={liveName}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 1280px) 279px, (min-width: 1024px) calc((100vw - 300px) / 4), (min-width: 768px) calc((100vw - 160px) / 3), calc((100vw - 47px) / 2)"
              src={livePicture}
              variant={imageVariant}
            />
          </div>
        ) : null}
      </span>
      <span className="mt-3 block max-w-[270px]">
        <span className="block font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]">
          {liveName}
        </span>
        {liveCode ? (
          <span className="mt-2 block text-[16px] leading-none text-[var(--cp-primary-300)]">
            {formatProductCode(liveCode)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export default function FlooringCatalogGridSection({ block, data }: FlooringCatalogGridSectionProps) {
  const { edit } = useEditState();
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname || "/flooring/catalog";
  const liveSearchParams = useSearchParams();

  const resolvedSearchParams = useMemo(
    () => new URLSearchParams(liveSearchParams?.toString() || ""),
    [liveSearchParams],
  );

  const queryState = useMemo(() => parseQueryState(resolvedSearchParams), [resolvedSearchParams]);

  const pageTitle = readString(block?.pageTitle, "Flooring Catalog");
  const cardImageSizeChoice = normalizeImageSizeChoice(
    typeof block?.cardImageSize === "string" ? block.cardImageSize : null,
    "card",
  );
  const filterImageSizeChoice = normalizeImageSizeChoice(
    typeof block?.filterImageSize === "string" ? block.filterImageSize : null,
    "thumb",
  );

  const catalogSettings = data.catalogSettings;
  const flooringOptions = useMemo(() => catalogSettings?.flooringTypes || [], [catalogSettings?.flooringTypes]);
  const flooringCardImageVariant = resolveConfiguredImageVariant(cardImageSizeChoice, "card");
  const flooringFilterImageVariant = resolveConfiguredImageVariant(filterImageSizeChoice, "thumb");

  const flooringMap = useMemo(
    () => new Map(flooringOptions.map((option) => [normalizeOptionValue(option.value), option])),
    [flooringOptions],
  );

  const flooring = useMemo(() => {
    return getOverviewFlooringItems(data)
      .map((item) => {
        const name = (item.name || "Flooring").trim();
        const slug = slugify(item.slug || item._sys?.filename || name);
        const code = (item.code || "").trim();
        const searchable = `${name} ${code}`.toLowerCase();
        const updatedAt = item.sourceUpdatedAt ? Date.parse(item.sourceUpdatedAt) : Number.NaN;

        return {
          raw: item as unknown as Record<string, unknown>,
          slug,
          name,
          code,
          picture: (item.picture || "").trim(),
          relativePath: (item._sys?.relativePath || "").trim(),
          searchable,
          flooringType: normalizeOptionValue(item.flooringType || ""),
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
        };
      })
      .filter((item) => item.slug.length > 0);
  }, [data]);

  const filteredItems = useMemo(() => {
    const searchValue = queryState.q.trim().toLowerCase();

    return flooring
      .filter((item) => {
        if (queryState.flooring.length > 0 && !queryState.flooring.includes(item.flooringType)) return false;
        if (searchValue && !item.searchable.includes(searchValue)) return false;
        return true;
      })
      .sort((left, right) => {
        if (queryState.sort === "az") return left.name.localeCompare(right.name);
        if (queryState.sort === "za") return right.name.localeCompare(left.name);

        if (right.updatedAt !== left.updatedAt) {
          return right.updatedAt - left.updatedAt;
        }

        return left.name.localeCompare(right.name);
      });
  }, [flooring, queryState.flooring, queryState.q, queryState.sort]);

  const totalResults = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(Math.max(queryState.page, 1), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  const visiblePages = useMemo(() => getVisiblePages(totalPages, currentPage), [currentPage, totalPages]);

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [pendingFlooring, setPendingFlooring] = useState<string[]>(queryState.flooring);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const { scrollToTarget: scrollToResultsTop } = usePaginationScrollTarget();

  const sortLabel = SORT_OPTIONS.find((option) => option.value === queryState.sort)?.label || "New";
  const selectedFlooringLabels = queryState.flooring.map((value) => ({
    value,
    label: flooringMap.get(value)?.label || toReadableLabel(value),
  }));

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
    router.push(query ? `${currentPathname}?${query}` : currentPathname, { scroll: false });
  }, [currentPathname, resolvedSearchParams, router]);

  useEffect(() => {
    if (queryState.page === currentPage) return;
    updateQuery({ page: String(currentPage) });
  }, [currentPage, queryState.page, updateQuery]);

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

  const applyFlooring = () => {
    updateQuery({ flooring: serializeMultiValue(pendingFlooring) }, true);
    setOpenPanel(null);
  };

  const handlePageChange = useCallback((nextPage: number) => {
    if (nextPage === currentPage) return;
    updateQuery({ page: String(nextPage) });
    scrollToResultsTop();
  }, [currentPage, scrollToResultsTop, updateQuery]);

  return (
    <section className="bg-white">
      <div className="cp-container px-4 pb-14 pt-8 md:px-10 md:pb-[72px] md:pt-[88px]">
        <h1
          className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
          data-tina-field={block ? tinaField(block, "pageTitle") || undefined : undefined}
        >
          {pageTitle}
        </h1>

        <div ref={filtersRef}>
          <div className="mt-4 flex items-center justify-between gap-6 md:hidden">
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
                <img alt="" aria-hidden className={`cp-inline-trigger__icon transition-transform ${openPanel === "sort" ? "-rotate-90" : "rotate-90"}`} src="/library/header/nav-chevron-right.svg" />
              </button>

              {openPanel === "sort" ? (
                <div className="absolute right-0 top-full z-30 mt-3 min-w-[184px] bg-white p-4 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)]">
                  <div className="flex flex-col gap-3">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        className={`text-left font-[var(--font-jost)] text-[16px] leading-[1.2] text-[var(--cp-gray-1)] transition-colors ${queryState.sort === option.value ? "font-semibold text-[var(--cp-primary-500)]" : "hover:text-[var(--cp-primary-350)]"}`}
                        key={`flooring-mobile-sort-${option.value}`}
                        onClick={() => {
                          updateQuery({ sort: option.value }, true);
                          setOpenPanel(null);
                        }}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:mt-12">
            <div className="flex items-center gap-10 md:hidden">
              <button
                className="cp-inline-trigger cp-inline-trigger--display cp-inline-trigger--large"
                onClick={() => {
                  setPendingFlooring(queryState.flooring);
                  setOpenPanel("flooring");
                }}
                type="button"
              >
                <span>Flooring Type</span>
                <img alt="" aria-hidden className="cp-inline-trigger__icon rotate-90" src="/library/header/nav-chevron-right.svg" />
              </button>
            </div>

            <div className="relative hidden md:block">
              <div className="flex items-start justify-between gap-8">
                <div className="flex flex-wrap items-center gap-10 pb-3">
                <button
                className="cp-inline-trigger cp-inline-trigger--display cp-inline-trigger--large"
                onClick={() => {
                  setPendingFlooring(queryState.flooring);
                  setOpenPanel((current) => (current === "flooring" ? null : "flooring"));
                }}
                type="button"
              >
                  <span>Flooring Type</span>
                  <img alt="" aria-hidden className="cp-inline-trigger__icon rotate-90" src="/library/header/nav-chevron-right.svg" />
                </button>
                </div>

                <div className="flex items-center gap-10 pb-3">
                <p className="font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)] md:text-[18px]">
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
                  selectedValue={queryState.sort}
                />
              </div>
            </div>

              {openPanel === "flooring" ? (
                <PanelShell className="absolute left-0 right-0 top-full z-30 mt-3" title="Flooring Type">
                  <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:mt-[52px] md:gap-10">
                    {flooringOptions.map((option, index) => {
                      const value = normalizeOptionValue(option.value);
                      const selected = pendingFlooring.includes(value);

                      return (
                        <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                          <FlooringOptionCard
                            imageVariant={flooringFilterImageVariant}
                            onClick={() => setPendingFlooring((current) => toggleMultiValue(current, value))}
                            option={option}
                            selected={selected}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex justify-center">
                    <Button className="!h-12 !px-8 !text-[20px]" onClick={applyFlooring} size="small" variant="outline">
                      Apply
                    </Button>
                  </div>
                </PanelShell>
              ) : null}
            </div>

            {queryState.flooring.length > 0 ? (
              <div className="flex flex-wrap items-center gap-4">
                {selectedFlooringLabels.map((item) => (
                  <button
                    className="cp-filter-chip"
                    key={item.value}
                    onClick={() => updateQuery({ flooring: serializeMultiValue(queryState.flooring.filter((value) => value !== item.value)) }, true)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-close.svg" />
                  </button>
                ))}

                <ClearFiltersButton onClick={() => updateQuery({ flooring: null }, true)}>
                  Clear filters
                </ClearFiltersButton>
              </div>
            ) : null}
          </div>

          <CatalogMobileFilterOverlay
            onApply={applyFlooring}
            onClose={() => setOpenPanel(null)}
            open={openPanel === "flooring"}
            title="Flooring Type"
          >
            <div className="grid grid-cols-2 gap-x-[15px] gap-y-8">
              {flooringOptions.map((option, index) => {
                const value = normalizeOptionValue(option.value);
                const selected = pendingFlooring.includes(value);

                return (
                  <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`mobile-flooring-${option.value}-${index}`}>
                    <FlooringOptionCard
                      imageVariant={flooringFilterImageVariant}
                      onClick={() => setPendingFlooring((current) => toggleMultiValue(current, value))}
                      option={option}
                      selected={selected}
                    />
                  </div>
                );
              })}
            </div>
          </CatalogMobileFilterOverlay>
        </div>

        {totalResults === 0 ? (
          <div className="mt-10 border border-[var(--cp-primary-100)] bg-[var(--cp-brand-neutral-50)] p-8 text-center">
            <p className="font-[var(--font-red-hat-display)] text-[24px] leading-[1.35] text-[var(--cp-primary-500)]">
              No flooring products match your current filters.
            </p>
            <p className="mt-2 text-[16px] leading-[1.5] text-[var(--cp-primary-500)]/80">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-7 grid grid-cols-2 gap-x-[15px] gap-y-8 md:mt-10 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 lg:gap-x-7">
              {paginatedItems.map((item) => (
                <div key={item.slug}>
                  {edit && item.relativePath ? (
                    <TinaFlooringCard imageVariant={flooringCardImageVariant} item={item as FlooringCardItem} />
                  ) : (
                    <StaticFlooringCard imageVariant={flooringCardImageVariant} item={item as FlooringCardItem} />
                  )}
                </div>
              ))}
            </div>

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
          </>
        )}
      </div>
    </section>
  );
}
