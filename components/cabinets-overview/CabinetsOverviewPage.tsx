"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tinaField, useEditState, useTina } from "tinacms/dist/react";
import { CABINET_LIVE_QUERY } from "@/app/cabinet-live-query";
import ContactUsSection from "@/components/home/ContactUsSection";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import FillImage from "@/components/ui/FillImage";
import Button from "@/components/ui/Button";
import { formatProductCode } from "@/components/cabinet-door/helpers";
import CatalogSortDropdown from "@/components/catalog-overview/CatalogSortDropdown";
import { usePaginationScrollTarget } from "@/components/catalog-overview/use-pagination-scroll";
import { resolveConfiguredImageVariant, type ImageSizeChoice } from "@/lib/image-size-controls";
import CatalogMobileFilterOverlay from "./CatalogMobileFilterOverlay";
import { DoorStyleOptionCard, FinishOptionCard } from "./CatalogFilterOptionCards";
import {
  getOverviewCabinetItems,
  inferDoorStyleValue,
  normalizeOptionValue,
} from "./normalize-cabinets-overview-query";
import type { CabinetsOverviewDataShape } from "./types";

const PAGE_SIZE = 16;
const SORT_OPTIONS = [
  { value: "az", label: "Products (A-Z)" },
  { value: "za", label: "Products (Z-A)" },
  { value: "new", label: "New" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type OpenPanel = "doorStyle" | "finish" | "sort" | null;
type FinishTab = "paint" | "stain";

interface QueryState {
  page: number;
  sort: SortValue;
  q: string;
  styles: string[];
  finishes: string[];
}

interface FaqItem {
  raw?: Record<string, unknown>;
  question: string;
  answer: string;
}

interface FaqTab {
  raw?: Record<string, unknown>;
  label: string;
  faqs: FaqItem[];
}

interface CabinetCardItem {
  raw: Record<string, unknown>;
  slug: string;
  name: string;
  code: string;
  picture: string;
  relativePath: string;
}

interface CabinetsOverviewPageProps {
  data: CabinetsOverviewDataShape;
  faqBlock?: Record<string, unknown> | null;
  contactBlock?: Record<string, unknown> | null;
  cardImageSizeChoice?: ImageSizeChoice | null;
  filterImageSizeChoice?: ImageSizeChoice | null;
  pageSettingsRecord?: Record<string, unknown> | null;
  pageTitle?: string | null;
}

function toDict(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^cabinets\//i, "")
    .replace(/\s+/g, "-");
}

function toReadableLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueNormalizedList(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const item = normalizeOptionValue(value);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    normalized.push(item);
  }

  return normalized;
}

function parseMultiValue(value: string | null): string[] {
  if (!value) return [];
  return uniqueNormalizedList(value.split(","));
}

function serializeMultiValue(values: string[]): string | null {
  const normalized = uniqueNormalizedList(values);
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
  const sort = normalizeOptionValue(params.get("sort") || "new");

  const normalizedSort: SortValue = SORT_OPTIONS.some((option) => option.value === sort)
    ? (sort as SortValue)
    : "new";

  return {
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    sort: normalizedSort,
    q: (params.get("q") || "").trim(),
    styles: parseMultiValue(params.get("style")),
    finishes: parseMultiValue(params.get("finish")),
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

function mapFaqTabs(block?: Record<string, unknown> | null): FaqTab[] {
  if (!block) return [];
  const tabs = Array.isArray(block.tabs) ? block.tabs : [];

  return tabs
    .map((tab) => {
      const rawTab = toDict(tab);
      const faqs = Array.isArray(rawTab.faqs) ? rawTab.faqs : [];

      return {
        raw: rawTab,
        label: readText(rawTab.label),
        faqs: faqs
          .map((faq) => {
            const rawFaq = toDict(faq);
            return {
              raw: rawFaq,
              question: readText(rawFaq.question),
              answer: readText(rawFaq.answer),
            };
          })
          .filter((faq) => faq.question.length > 0),
      };
    })
    .filter((tab) => tab.label.length > 0 && tab.faqs.length > 0);
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

function StaticCabinetCard({
  item,
  imageVariant,
}: {
  item: CabinetCardItem;
  imageVariant?: ReturnType<typeof resolveConfiguredImageVariant>;
}) {
  return (
    <div className="group block">
      <Link
        className="block"
        data-tina-field={tinaField(item.raw, "name") || undefined}
        href={`/cabinets/${item.slug}`}
      >
        <span className="relative block aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
          {item.picture ? (
            <FillImage
              alt={item.name}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              src={item.picture}
              variant={imageVariant}
            />
          ) : null}
        </span>
        <span className="mt-2.5 block font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]">
          {item.name}
        </span>
        {item.code ? (
          <span className="block text-[16px] leading-none text-[var(--cp-primary-300)]">
            {formatProductCode(item.code)}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

function TinaCabinetCard({
  item,
  imageVariant,
}: {
  item: CabinetCardItem;
  imageVariant?: ReturnType<typeof resolveConfiguredImageVariant>;
}) {
  const initialData = useMemo(() => ({ cabinet: item.raw }), [item.relativePath]);
  const variables = useMemo(() => ({ relativePath: item.relativePath }), [item.relativePath]);

  const { data } = useTina({
    data: initialData,
    query: CABINET_LIVE_QUERY,
    variables,
  });

  const liveCabinet = data.cabinet as Record<string, unknown> | null | undefined;
  const liveName = typeof liveCabinet?.name === "string" ? liveCabinet.name : item.name;
  const liveCode = typeof liveCabinet?.code === "string" ? liveCabinet.code : item.code;
  const livePicture = typeof liveCabinet?.picture === "string" ? liveCabinet.picture : item.picture;
  const liveSlug = typeof liveCabinet?.slug === "string" && liveCabinet.slug.trim().length > 0 ? liveCabinet.slug : item.slug;

  return (
    <div className="group block">
      <Link
        className="block"
        data-tina-field={liveCabinet ? tinaField(liveCabinet, "name") || undefined : undefined}
        href={`/cabinets/${liveSlug}`}
      >
        <span className="relative block aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
          {livePicture ? (
            <FillImage
              alt={liveName}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              src={livePicture}
              variant={imageVariant}
            />
          ) : null}
        </span>
        <span className="mt-2.5 block font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]">
          {liveName}
        </span>
        {liveCode ? (
          <span className="block text-[16px] leading-none text-[var(--cp-primary-300)]">
            {formatProductCode(liveCode)}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

export default function CabinetsOverviewPage({
  data,
  faqBlock,
  contactBlock,
  cardImageSizeChoice,
  filterImageSizeChoice,
  pageSettingsRecord,
  pageTitle,
}: CabinetsOverviewPageProps) {
  const { edit } = useEditState();
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname || "/cabinets";
  const liveSearchParams = useSearchParams();

  const resolvedSearchParams = useMemo(
    () => new URLSearchParams(liveSearchParams?.toString() || ""),
    [liveSearchParams],
  );

  const queryState = useMemo(() => parseQueryState(resolvedSearchParams), [resolvedSearchParams]);

  const catalogSettings = data.catalogSettings;
  const doorStyles = useMemo(() => catalogSettings?.doorStyles || [], [catalogSettings?.doorStyles]);
  const paintOptions = useMemo(() => catalogSettings?.paintOptions || [], [catalogSettings?.paintOptions]);
  const stainTypes = useMemo(() => catalogSettings?.stainTypes || [], [catalogSettings?.stainTypes]);
  const faqTabs = useMemo(() => mapFaqTabs(faqBlock), [faqBlock]);
  const cabinetCardImageVariant = resolveConfiguredImageVariant(cardImageSizeChoice, "card");

  const doorStyleMap = useMemo(
    () => new Map(doorStyles.map((option) => [normalizeOptionValue(option.value), option])),
    [doorStyles],
  );
  const paintMap = useMemo(
    () => new Map(paintOptions.map((option) => [normalizeOptionValue(option.value), option])),
    [paintOptions],
  );
  const stainMap = useMemo(
    () => new Map(stainTypes.map((option) => [normalizeOptionValue(option.value), option])),
    [stainTypes],
  );

  const paintValueSet = useMemo(() => new Set(paintMap.keys()), [paintMap]);
  const stainValueSet = useMemo(() => new Set(stainMap.keys()), [stainMap]);

  const cabinets = useMemo(() => {
    return getOverviewCabinetItems(data)
      .map((item) => {
        const name = (item.name || "Cabinet Door").trim();
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
          doorStyle: inferDoorStyleValue(name, item.doorStyle),
          paint: normalizeOptionValue(item.paint || ""),
          stainType: normalizeOptionValue(item.stainType || ""),
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
        };
      })
      .filter((item) => item.slug.length > 0);
  }, [data]);

  const filteredItems = useMemo(() => {
    const searchValue = queryState.q.trim().toLowerCase();

    return cabinets
      .filter((item) => {
        if (queryState.styles.length > 0 && !queryState.styles.includes(item.doorStyle)) return false;

        if (queryState.finishes.length > 0) {
          const hasMatchingFinish = queryState.finishes.some((finish) => {
            if (stainValueSet.has(finish)) {
              return item.stainType === finish;
            }

            if (paintValueSet.has(finish)) {
              return item.paint === finish;
            }

            return item.paint === finish || item.stainType === finish;
          });

          if (!hasMatchingFinish) return false;
        }

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
  }, [cabinets, paintValueSet, queryState.finishes, queryState.q, queryState.sort, queryState.styles, stainValueSet]);

  const totalResults = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(Math.max(queryState.page, 1), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  const visiblePages = useMemo(() => getVisiblePages(totalPages, currentPage), [currentPage, totalPages]);

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [finishTab, setFinishTab] = useState<FinishTab>("paint");
  const [pendingDoorStyles, setPendingDoorStyles] = useState<string[]>(queryState.styles);
  const [pendingFinishes, setPendingFinishes] = useState<string[]>(queryState.finishes);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const { scrollToTarget: scrollToResultsTop } = usePaginationScrollTarget();

  const sortLabel = SORT_OPTIONS.find((option) => option.value === queryState.sort)?.label || "New";
  const selectedStyleLabels = useMemo(
    () => queryState.styles.map((value) => doorStyleMap.get(value)?.label || toReadableLabel(value)),
    [doorStyleMap, queryState.styles],
  );
  const selectedFinishLabels = useMemo(
    () => queryState.finishes.map((value) => paintMap.get(value)?.label || stainMap.get(value)?.label || toReadableLabel(value)),
    [paintMap, queryState.finishes, stainMap],
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
    router.push(query ? `${currentPathname}?${query}` : currentPathname, { scroll: false });
  }, [currentPathname, resolvedSearchParams, router]);

  useEffect(() => {
    if (queryState.page === currentPage) return;
    updateQuery({ page: String(currentPage) });
  }, [currentPage, queryState.page, updateQuery]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

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

  const applyDoorStyle = () => {
    updateQuery({ style: serializeMultiValue(pendingDoorStyles) }, true);
    setOpenPanel(null);
  };

  const applyFinish = () => {
    updateQuery({ finish: serializeMultiValue(pendingFinishes) }, true);
    setOpenPanel(null);
  };

  const handlePageChange = useCallback((nextPage: number) => {
    if (nextPage === currentPage) return;
    updateQuery({ page: String(nextPage) });
    scrollToResultsTop();
  }, [currentPage, scrollToResultsTop, updateQuery]);

  return (
    <div className="bg-white" suppressHydrationWarning>
      <section className="bg-white">
        <div className="cp-container px-4 pb-14 pt-8 md:px-10 md:pb-16 md:pt-12">
          <h1
            className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
            data-tina-field={pageSettingsRecord ? tinaField(pageSettingsRecord, "pageTitle") || undefined : undefined}
          >
            {pageTitle || "Cabinets"}
          </h1>

          <div ref={filtersRef}>
            <div className="mt-4 flex items-center justify-between gap-6 md:hidden">
              <p className="font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)]">
                <span>Showing </span>
                <span className="font-bold">{totalResults} results</span>
              </p>

              <div className="relative">
                <button
                  className="inline-flex items-center gap-2 font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)]"
                  onClick={() => setOpenPanel((current) => (current === "sort" ? null : "sort"))}
                  type="button"
                >
                  <span>
                    Sort by <span className="font-bold">{sortLabel}</span>
                  </span>
                  <img
                    alt=""
                    aria-hidden
                    className={`h-4 w-4 transition-transform ${openPanel === "sort" ? "-rotate-90" : "rotate-90"}`}
                    src="/library/header/nav-chevron-right.svg"
                  />
                </button>

                {openPanel === "sort" ? (
                  <div className="absolute right-0 top-full z-30 mt-3 min-w-[184px] bg-white p-4 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)]">
                    <div className="flex flex-col gap-3">
                      {SORT_OPTIONS.map((option) => {
                        const selected = queryState.sort === option.value;

                        return (
                          <button
                            className={`text-left font-[var(--font-red-hat-display)] text-[16px] leading-[1.5] text-[var(--cp-primary-500)] ${
                              selected ? "font-semibold" : ""
                            }`}
                            key={`mobile-sort-${option.value}`}
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

            <div className="relative mt-4 hidden flex-col gap-4 md:flex md:flex-row md:items-center md:justify-between">
              <p className="font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)] md:text-[18px]">
                <span>Showing </span>
                <span className="font-bold">{totalResults} results</span>
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <label className="flex h-10 w-full items-center gap-2 rounded-[2px] border border-[var(--cp-primary-100)] px-3 sm:w-[268px]">
                  <img alt="" aria-hidden className="h-5 w-5" src="/library/header/nav-search.svg" />
                  <input
                    className="h-full w-full border-0 bg-transparent text-[14px] leading-[1.5] text-[var(--cp-primary-500)] outline-none placeholder:text-[var(--cp-primary-300)]"
                    defaultValue={queryState.q}
                    key={queryState.q}
                    onChange={(event) => {
                      const value = event.target.value.trim();
                      if (searchDebounceRef.current) {
                        window.clearTimeout(searchDebounceRef.current);
                      }

                      searchDebounceRef.current = window.setTimeout(() => {
                        if (value === queryState.q) return;
                        updateQuery({ q: value || null }, true);
                      }, 350);
                    }}
                    placeholder="Search by name or code"
                    type="search"
                  />
                </label>

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

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center gap-10 md:hidden">
                <button
                  className="inline-flex items-center gap-[9px] text-[20px] leading-none text-[var(--cp-primary-500)]"
                  onClick={() => {
                    setPendingDoorStyles(queryState.styles);
                    setOpenPanel("doorStyle");
                  }}
                  type="button"
                >
                  <span>Door style</span>
                  <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                </button>

                <button
                  className="inline-flex items-center gap-[9px] text-[20px] leading-none text-[var(--cp-primary-500)]"
                  onClick={() => {
                    setPendingFinishes(queryState.finishes);
                    setFinishTab(queryState.finishes.some((value) => stainValueSet.has(value)) ? "stain" : "paint");
                    setOpenPanel("finish");
                  }}
                  type="button"
                >
                  <span>Finish</span>
                  <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                </button>
              </div>

              <div className="relative hidden flex-wrap items-center gap-6 md:flex md:gap-10">
                <div className="pb-3">
                  <button
                    className="inline-flex items-center gap-[9px] text-[20px] leading-none text-[var(--cp-primary-500)]"
                    onClick={() => {
                      setPendingDoorStyles(queryState.styles);
                      setOpenPanel((current) => (current === "doorStyle" ? null : "doorStyle"));
                    }}
                    type="button"
                  >
                      <span>Door style</span>
                      <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                    </button>

                  {openPanel === "doorStyle" ? (
                      <div className="absolute left-0 right-0 top-full z-30 w-full bg-white p-6 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)]">
                        <h2 className="text-center font-[var(--font-red-hat-display)] text-[28px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)]">
                          Select door style
                        </h2>

                        <div className="mt-8 flex flex-wrap items-start justify-center gap-8">
                          {doorStyles.map((option, index) => {
                            const value = normalizeOptionValue(option.value);
                            const selected = pendingDoorStyles.includes(value);

                            return (
                              <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                                <DoorStyleOptionCard
                                  imageSizeChoice={filterImageSizeChoice || undefined}
                                  onClick={() => setPendingDoorStyles((current) => toggleMultiValue(current, value))}
                                  option={option}
                                  selected={selected}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-10 flex justify-center">
                          <Button className="!h-12 !px-8 !text-[20px]" onClick={applyDoorStyle} size="small" variant="outline">
                            Apply
                          </Button>
                        </div>
                  </div>
                ) : null}
              </div>

                <div className="pb-3">
                  <button
                    className="inline-flex items-center gap-[9px] text-[20px] leading-none text-[var(--cp-primary-500)]"
                    onClick={() => {
                      setPendingFinishes(queryState.finishes);
                      setFinishTab(queryState.finishes.some((value) => stainValueSet.has(value)) ? "stain" : "paint");
                      setOpenPanel((current) => (current === "finish" ? null : "finish"));
                    }}
                    type="button"
                  >
                      <span>Finish</span>
                      <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                    </button>

                    {openPanel === "finish" ? (
                      <div className="absolute left-0 right-0 top-full z-30 w-full bg-white p-6 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)]">
                        <h2 className="text-center font-[var(--font-red-hat-display)] text-[28px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)]">
                          Select Finish
                        </h2>

                        <div className="mt-6 flex items-start justify-center gap-8">
                          <button
                            className={`flex flex-col items-center gap-0.5 font-[var(--font-red-hat-display)] text-[20px] font-semibold uppercase tracking-[0.01em] ${
                              finishTab === "paint" ? "text-[var(--cp-primary-500)]" : "text-[var(--cp-primary-500)]/85"
                            }`}
                            onClick={() => setFinishTab("paint")}
                            type="button"
                          >
                            <span>Paint</span>
                            <span className={`h-0.5 w-full ${finishTab === "paint" ? "bg-[var(--cp-primary-500)]" : "bg-transparent"}`} />
                          </button>
                          <button
                            className={`flex flex-col items-center gap-0.5 font-[var(--font-red-hat-display)] text-[20px] font-semibold uppercase tracking-[0.01em] ${
                              finishTab === "stain" ? "text-[var(--cp-primary-500)]" : "text-[var(--cp-primary-500)]/85"
                            }`}
                            onClick={() => setFinishTab("stain")}
                            type="button"
                          >
                            <span>Stain</span>
                            <span className={`h-0.5 w-full ${finishTab === "stain" ? "bg-[var(--cp-primary-500)]" : "bg-transparent"}`} />
                          </button>
                        </div>

                        <div className="mt-9 flex flex-wrap items-start justify-center gap-6">
                          {(finishTab === "paint" ? paintOptions : stainTypes).map((option, index) => {
                            const value = normalizeOptionValue(option.value);
                            const selected = pendingFinishes.includes(value);

                            return (
                              <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                                <FinishOptionCard
                                  imageSizeChoice={filterImageSizeChoice || undefined}
                                  onClick={() => setPendingFinishes((current) => toggleMultiValue(current, value))}
                                  option={option}
                                  selected={selected}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-10 flex justify-center">
                          <Button className="!h-12 !px-8 !text-[20px]" onClick={applyFinish} size="small" variant="outline">
                            Apply
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

            {(queryState.styles.length > 0 || queryState.finishes.length > 0) ? (
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {queryState.styles.map((value, index) => (
                  <button
                    className="inline-flex h-8 items-center gap-[6px] border border-[var(--cp-primary-500)] px-3 text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
                    key={`style-chip-${value}-${index}`}
                    onClick={() =>
                      updateQuery(
                        { style: serializeMultiValue(queryState.styles.filter((item) => item !== value)) },
                        true,
                      )
                    }
                    type="button"
                  >
                    <span>{selectedStyleLabels[index] || toReadableLabel(value)}</span>
                    <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-close.svg" />
                  </button>
                ))}

                {queryState.finishes.map((value, index) => (
                  <button
                    className="inline-flex h-8 items-center gap-[6px] border border-[var(--cp-primary-500)] px-3 text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
                    key={`finish-chip-${value}-${index}`}
                    onClick={() =>
                      updateQuery(
                        { finish: serializeMultiValue(queryState.finishes.filter((item) => item !== value)) },
                        true,
                      )
                    }
                    type="button"
                  >
                    <span>{selectedFinishLabels[index] || toReadableLabel(value)}</span>
                    <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-close.svg" />
                  </button>
                ))}

                <button
                  className="text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
                  onClick={() => updateQuery({ style: null, finish: null }, true)}
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            ) : null}

            <CatalogMobileFilterOverlay
              onApply={applyDoorStyle}
              onClose={() => setOpenPanel(null)}
              open={openPanel === "doorStyle"}
              title="Select door style"
            >
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-8">
                {doorStyles.map((option, index) => {
                  const value = normalizeOptionValue(option.value);
                  const selected = pendingDoorStyles.includes(value);

                  return (
                    <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`mobile-door-style-${option.value}-${index}`}>
                      <DoorStyleOptionCard
                        imageSizeChoice={filterImageSizeChoice || undefined}
                        onClick={() => setPendingDoorStyles((current) => toggleMultiValue(current, value))}
                        option={option}
                        selected={selected}
                      />
                    </div>
                  );
                })}
              </div>
            </CatalogMobileFilterOverlay>

            <CatalogMobileFilterOverlay
              onApply={applyFinish}
              onClose={() => setOpenPanel(null)}
              open={openPanel === "finish"}
              tabs={
                <div className="flex items-start gap-8">
                  <button
                    className="flex flex-col items-center gap-0.5 font-[var(--font-red-hat-display)] text-[18px] font-semibold uppercase tracking-[0.01em] text-[var(--cp-primary-500)]"
                    onClick={() => setFinishTab("paint")}
                    type="button"
                  >
                    <span>Paint</span>
                    <span className={`h-0.5 w-full ${finishTab === "paint" ? "bg-[var(--cp-primary-500)]" : "bg-transparent"}`} />
                  </button>
                  <button
                    className="flex flex-col items-center gap-0.5 font-[var(--font-red-hat-display)] text-[18px] font-semibold uppercase tracking-[0.01em] text-[var(--cp-primary-500)]"
                    onClick={() => setFinishTab("stain")}
                    type="button"
                  >
                    <span>Stain</span>
                    <span className={`h-0.5 w-full ${finishTab === "stain" ? "bg-[var(--cp-primary-500)]" : "bg-transparent"}`} />
                  </button>
                </div>
              }
              title="Select Finish"
            >
              {finishTab === "paint" ? (
                <div className="grid grid-cols-3 justify-between gap-x-[12.5px] gap-y-8">
                  {paintOptions.map((option, index) => {
                    const value = normalizeOptionValue(option.value);
                    const selected = pendingFinishes.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`mobile-paint-${option.value}-${index}`}>
                        <FinishOptionCard
                          imageSizeChoice={filterImageSizeChoice || undefined}
                          onClick={() => setPendingFinishes((current) => toggleMultiValue(current, value))}
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
                    const selected = pendingFinishes.includes(value);

                    return (
                      <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`mobile-stain-${option.value}-${index}`}>
                        <DoorStyleOptionCard
                          imageSizeChoice={filterImageSizeChoice || undefined}
                          onClick={() => setPendingFinishes((current) => toggleMultiValue(current, value))}
                          option={option}
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CatalogMobileFilterOverlay>
          </div>

          </div>

          {totalResults === 0 ? (
            <div className="mt-10 border border-[var(--cp-primary-100)] bg-[var(--cp-brand-neutral-50)] p-8 text-center">
              <p className="font-[var(--font-red-hat-display)] text-[24px] leading-[1.35] text-[var(--cp-primary-500)]">
                No cabinets match your current filters.
              </p>
              <p className="mt-2 text-[16px] leading-[1.5] text-[var(--cp-primary-500)]/80">
                Try adjusting filters or search terms.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
                {paginatedItems.map((item) => (
                  <div key={item.slug}>
                    {edit && item.relativePath ? (
                      <TinaCabinetCard imageVariant={cabinetCardImageVariant} item={item as CabinetCardItem} />
                    ) : (
                      <StaticCabinetCard imageVariant={cabinetCardImageVariant} item={item as CabinetCardItem} />
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

      {faqTabs.length ? (
        <section className="bg-[var(--cp-brand-neutral-50)]">
          <div className="cp-container px-4 py-14 md:px-10 md:py-16" data-tina-field={faqBlock ? tinaField(faqBlock) : undefined}>
            <h2 className="text-center font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]">
              F.A.Q.
            </h2>
            <FaqTabsAccordion tabs={faqTabs} />
          </div>
        </section>
      ) : null}

      {contactBlock ? <ContactUsSection block={contactBlock} /> : null}
    </div>
  );
}
