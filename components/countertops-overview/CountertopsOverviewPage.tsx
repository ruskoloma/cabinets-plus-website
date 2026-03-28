"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tinaField, useEditState, useTina } from "tinacms/dist/react";
import { COUNTERTOP_LIVE_QUERY } from "@/app/countertop-live-query";
import ContactUsSection from "@/components/home/ContactUsSection";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import FillImage from "@/components/ui/FillImage";
import Button from "@/components/ui/Button";
import { formatProductCode } from "@/components/cabinet-door/helpers";
import CatalogSortDropdown from "@/components/catalog-overview/CatalogSortDropdown";
import { usePaginationScrollTarget } from "@/components/catalog-overview/use-pagination-scroll";
import { resolveConfiguredImageVariant, type ImageSizeChoice } from "@/lib/image-size-controls";
import type { ImageVariantPreset } from "@/lib/image-variants";
import CatalogMobileFilterOverlay from "@/components/cabinets-overview/CatalogMobileFilterOverlay";
import {
  getOverviewCountertopItems,
  normalizeOptionValue,
} from "./normalize-countertops-overview-query";
import type { CountertopsOverviewDataShape } from "./types";

const PAGE_SIZE = 16;
const SORT_OPTIONS = [
  { value: "az", label: "Products (A-Z)" },
  { value: "za", label: "Products (Z-A)" },
  { value: "new", label: "New" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type OpenPanel = "countertop" | "sort" | null;

interface QueryState {
  page: number;
  sort: SortValue;
  q: string;
  countertop: string;
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

interface CountertopCardItem {
  raw: Record<string, unknown>;
  slug: string;
  name: string;
  code: string;
  picture: string;
  relativePath: string;
}

interface CountertopsOverviewPageProps {
  data: CountertopsOverviewDataShape;
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
    .replace(/^countertops\//i, "")
    .replace(/\s+/g, "-");
}

function toReadableLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    countertop: normalizeOptionValue(params.get("countertop") || ""),
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

function PanelShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="mt-5 border border-[var(--cp-primary-100)] bg-white p-5 shadow-[0_8px_12px_6px_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)] md:absolute md:left-0 md:right-0 md:top-full md:z-30 md:mt-3 md:p-8">
      <h2 className="text-center font-[var(--font-red-hat-display)] text-[24px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function CountertopOptionState({ selected }: { selected: boolean }) {
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

function CountertopOptionCard({
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
        <CountertopOptionState selected={selected} />
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

function StaticCountertopCard({
  item,
  imageVariant,
}: {
  item: CountertopCardItem;
  imageVariant?: ImageVariantPreset;
}) {
  return (
    <Link className="group block" href={`/countertops/${item.slug}`}>
      <span className="block aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
        {item.picture ? (
          <div className="relative h-full w-full">
            <FillImage
              alt={item.name}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              data-tina-field={tinaField(item.raw, "picture")}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              src={item.picture}
              variant={imageVariant}
            />
          </div>
        ) : null}
      </span>
      <span
        className="mt-2.5 block font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]"
        data-tina-field={tinaField(item.raw, "name")}
      >
        {item.name}
      </span>
      {item.code ? (
        <span
          className="block text-[16px] leading-none text-[var(--cp-primary-300)]"
          data-tina-field={tinaField(item.raw, "code")}
        >
          {formatProductCode(item.code)}
        </span>
      ) : null}
    </Link>
  );
}

function TinaCountertopCard({
  item,
  imageVariant,
}: {
  item: CountertopCardItem;
  imageVariant?: ImageVariantPreset;
}) {
  const initialData = useMemo(() => ({ countertop: item.raw }), [item.relativePath]);
  const variables = useMemo(() => ({ relativePath: item.relativePath }), [item.relativePath]);

  const { data } = useTina({
    data: initialData,
    query: COUNTERTOP_LIVE_QUERY,
    variables,
  });

  const liveCountertop = data.countertop as Record<string, unknown> | null | undefined;
  const liveName = typeof liveCountertop?.name === "string" ? liveCountertop.name : item.name;
  const liveCode = typeof liveCountertop?.code === "string" ? liveCountertop.code : item.code;
  const livePicture = typeof liveCountertop?.picture === "string" ? liveCountertop.picture : item.picture;
  const liveSlug =
    typeof liveCountertop?.slug === "string" && liveCountertop.slug.trim().length > 0
      ? liveCountertop.slug
      : item.slug;

  return (
    <Link
      className="group block"
      data-tina-field={liveCountertop ? tinaField(liveCountertop, "name") || undefined : undefined}
      href={`/countertops/${liveSlug}`}
    >
      <span className="block aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
        {livePicture ? (
          <div className="relative h-full w-full">
            <FillImage
              alt={liveName}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              src={livePicture}
              variant={imageVariant}
            />
          </div>
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
  );
}

export default function CountertopsOverviewPage({
  data,
  faqBlock,
  contactBlock,
  cardImageSizeChoice,
  filterImageSizeChoice,
  pageSettingsRecord,
  pageTitle,
}: CountertopsOverviewPageProps) {
  const { edit } = useEditState();
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname || "/countertops";
  const liveSearchParams = useSearchParams();

  const resolvedSearchParams = useMemo(
    () => new URLSearchParams(liveSearchParams?.toString() || ""),
    [liveSearchParams],
  );

  const queryState = useMemo(() => parseQueryState(resolvedSearchParams), [resolvedSearchParams]);

  const catalogSettings = data.catalogSettings;
  const countertopOptions = useMemo(() => catalogSettings?.countertopTypes || [], [catalogSettings?.countertopTypes]);
  const faqTabs = useMemo(() => mapFaqTabs(faqBlock), [faqBlock]);
  const countertopCardImageVariant = resolveConfiguredImageVariant(cardImageSizeChoice, "card");
  const countertopFilterImageVariant = resolveConfiguredImageVariant(filterImageSizeChoice, "thumb");

  const countertopMap = useMemo(
    () => new Map(countertopOptions.map((option) => [normalizeOptionValue(option.value), option])),
    [countertopOptions],
  );

  const countertops = useMemo(() => {
    return getOverviewCountertopItems(data)
      .map((item) => {
        const name = (item.name || "Countertop").trim();
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
          countertopType: normalizeOptionValue(item.countertopType || ""),
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
        };
      })
      .filter((item) => item.slug.length > 0);
  }, [data]);

  const filteredItems = useMemo(() => {
    const searchValue = queryState.q.trim().toLowerCase();

    return countertops
      .filter((item) => {
        if (queryState.countertop && item.countertopType !== queryState.countertop) return false;
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
  }, [countertops, queryState.countertop, queryState.q, queryState.sort]);

  const totalResults = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(Math.max(queryState.page, 1), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  const visiblePages = useMemo(() => getVisiblePages(totalPages, currentPage), [currentPage, totalPages]);

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [pendingCountertop, setPendingCountertop] = useState<string | null>(queryState.countertop || null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const { scrollToTarget: scrollToResultsTop } = usePaginationScrollTarget();

  const sortLabel = SORT_OPTIONS.find((option) => option.value === queryState.sort)?.label || "New";
  const selectedCountertopLabel = queryState.countertop
    ? countertopMap.get(queryState.countertop)?.label || toReadableLabel(queryState.countertop)
    : "";

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

  const applyCountertop = () => {
    updateQuery({ countertop: pendingCountertop || null }, true);
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
            {pageTitle || "Countertops"}
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
                  <img alt="" aria-hidden className={`h-4 w-4 transition-transform ${openPanel === "sort" ? "-rotate-90" : "rotate-90"}`} src="/library/header/nav-chevron-right.svg" />
                </button>

                {openPanel === "sort" ? (
                  <div className="absolute right-0 top-full z-30 mt-3 min-w-[184px] bg-white p-4 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)]">
                    <div className="flex flex-col gap-3">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          className={`text-left font-[var(--font-red-hat-display)] text-[16px] leading-[1.5] text-[var(--cp-primary-500)] ${queryState.sort === option.value ? "font-semibold" : ""}`}
                          key={`countertops-mobile-sort-${option.value}`}
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
                    setPendingCountertop(queryState.countertop || null);
                    setOpenPanel("countertop");
                  }}
                  type="button"
                >
                  <span>Select Countertop</span>
                  <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                </button>
              </div>

              <div className="relative hidden flex-wrap items-center gap-6 md:flex md:gap-10">
                <div className="pb-3">
                  <button
                  className="inline-flex items-center gap-[9px] text-[20px] leading-none text-[var(--cp-primary-500)]"
                  onClick={() => {
                    setPendingCountertop(queryState.countertop || null);
                    setOpenPanel((current) => (current === "countertop" ? null : "countertop"));
                  }}
                  type="button"
                >
                    <span>Select Countertop</span>
                    <img alt="" aria-hidden className="h-4 w-4 rotate-90" src="/library/header/nav-chevron-right.svg" />
                  </button>

                  {openPanel === "countertop" ? (
                    <PanelShell title="Select Countertop">
                      <div className="mt-8 flex flex-wrap items-start justify-center gap-6 md:mt-[52px] md:gap-10">
                        {countertopOptions.map((option, index) => {
                          const value = normalizeOptionValue(option.value);
                          const selected = pendingCountertop === value;

                          return (
                            <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`${option.value}-${index}`}>
                              <CountertopOptionCard
                                imageVariant={countertopFilterImageVariant}
                                onClick={() => setPendingCountertop((current) => (current === value ? null : value))}
                                option={option}
                                selected={selected}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-8 flex justify-center">
                        <Button className="!h-12 !px-8 !text-[20px]" onClick={applyCountertop} size="small" variant="outline">
                          Apply
                        </Button>
                      </div>
                    </PanelShell>
                  ) : null}
                </div>
              </div>

              {queryState.countertop ? (
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    className="inline-flex h-8 items-center gap-[6px] border border-[var(--cp-primary-500)] px-3 text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
                    onClick={() => updateQuery({ countertop: null }, true)}
                    type="button"
                  >
                    <span>{selectedCountertopLabel}</span>
                    <img alt="" aria-hidden className="h-4 w-4" src="/library/header/nav-close.svg" />
                  </button>

                  <button
                    className="text-[14px] font-medium uppercase tracking-[0.02em] text-[var(--cp-primary-500)]"
                    onClick={() => updateQuery({ countertop: null }, true)}
                    type="button"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>

            <CatalogMobileFilterOverlay
              onApply={applyCountertop}
              onClose={() => setOpenPanel(null)}
              open={openPanel === "countertop"}
              title="Select Countertop"
            >
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-8">
                {countertopOptions.map((option, index) => {
                  const value = normalizeOptionValue(option.value);
                  const selected = pendingCountertop === value;

                  return (
                    <div data-tina-field={tinaField(option as unknown as Record<string, unknown>)} key={`mobile-countertop-${option.value}-${index}`}>
                      <CountertopOptionCard
                        imageVariant={countertopFilterImageVariant}
                        onClick={() => setPendingCountertop((current) => (current === value ? null : value))}
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
                No countertops match your current filters.
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
                      <TinaCountertopCard imageVariant={countertopCardImageVariant} item={item as CountertopCardItem} />
                    ) : (
                      <StaticCountertopCard imageVariant={countertopCardImageVariant} item={item as CountertopCardItem} />
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
