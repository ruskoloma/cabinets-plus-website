import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import type { GalleryProjectItemData, GalleryProjectMediaData } from "./types";

export interface GalleryFilterState {
  room: string;
  doorStyles: string[];
  finishes: string[];
  countertops: string[];
  flooringOnly: boolean;
}

export interface GalleryQueryState extends GalleryFilterState {
  page: number;
}

export interface RankedGalleryProjectData extends GalleryProjectItemData {
  previewImage: string;
  previewMedia: GalleryProjectMediaData | null;
  matchedFilterCount: number;
  matchedCategoryCount: number;
  totalSelectedFilterCount: number;
  fullMatch: boolean;
}

export const EMPTY_GALLERY_FILTERS: GalleryFilterState = {
  room: "",
  doorStyles: [],
  finishes: [],
  countertops: [],
  flooringOnly: false,
};

interface MediaScore {
  media: GalleryProjectMediaData;
  matchCount: number;
  priorityScore: number;
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

function isTruthyFlag(value: string | null): boolean {
  const normalized = normalizeOptionValue(value || "");
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function compareRoomOnlyMedia(left: GalleryProjectMediaData, right: GalleryProjectMediaData): number {
  if (left.roomPriority !== right.roomPriority) {
    return Number(right.roomPriority) - Number(left.roomPriority);
  }

  return left.order - right.order;
}

function scoreMedia(
  media: GalleryProjectMediaData,
  selectedFinishes: string[],
  selectedCountertops: string[],
): MediaScore {
  const paintMatches = selectedFinishes.filter((value) => media.paints.includes(value)).length;
  const stainMatches = selectedFinishes.filter((value) => media.stains.includes(value)).length;
  const countertopMatches = selectedCountertops.filter((value) => media.countertop === value).length;

  return {
    media,
    matchCount: paintMatches + stainMatches + countertopMatches,
    priorityScore:
      (paintMatches > 0 && media.paintPriority ? 1 : 0) +
      (stainMatches > 0 && media.stainPriority ? 1 : 0) +
      (countertopMatches > 0 && media.countertopPriority ? 1 : 0),
  };
}

function compareScoredMedia(left: MediaScore, right: MediaScore): number {
  if (left.matchCount !== right.matchCount) {
    return right.matchCount - left.matchCount;
  }

  if (left.priorityScore !== right.priorityScore) {
    return right.priorityScore - left.priorityScore;
  }

  return left.media.order - right.media.order;
}

function getScopedMedia(project: GalleryProjectItemData, filters: GalleryFilterState): GalleryProjectMediaData[] {
  let media = filters.room ? project.media.filter((item) => item.room === filters.room) : project.media;

  if (filters.flooringOnly) {
    media = media.filter((item) => item.flooring);
  }

  return media;
}

function pickPreviewImage(
  project: GalleryProjectItemData,
  filters: GalleryFilterState,
  scopedMedia: GalleryProjectMediaData[],
): { previewImage: string; previewMedia: GalleryProjectMediaData | null } {
  const fallbackMedia = scopedMedia[0] || project.media[0] || null;
  const fallbackImage = fallbackMedia?.file || project.coverImage;
  const hasMediaFilters = filters.finishes.length > 0 || filters.countertops.length > 0;

  if (!fallbackImage) {
    return {
      previewImage: project.coverImage,
      previewMedia: fallbackMedia,
    };
  }

  if (filters.room && !hasMediaFilters) {
    const bestRoomMedia = [...scopedMedia].sort(compareRoomOnlyMedia)[0] || fallbackMedia;
    return {
      previewImage: bestRoomMedia?.file || fallbackImage,
      previewMedia: bestRoomMedia,
    };
  }

  if (!filters.room && !hasMediaFilters && !filters.flooringOnly) {
    return {
      previewImage: project.coverImage || fallbackImage,
      previewMedia: project.media.find((item) => item.file === project.coverImage) || fallbackMedia,
    };
  }

  if (!hasMediaFilters) {
    return {
      previewImage: fallbackImage,
      previewMedia: fallbackMedia,
    };
  }

  const bestMatch = scopedMedia
    .map((media) => scoreMedia(media, filters.finishes, filters.countertops))
    .sort(compareScoredMedia)[0];

  if (!bestMatch || bestMatch.matchCount <= 0) {
    if (filters.room) {
      const bestRoomMedia = [...scopedMedia].sort(compareRoomOnlyMedia)[0] || fallbackMedia;
      return {
        previewImage: bestRoomMedia?.file || fallbackImage,
        previewMedia: bestRoomMedia,
      };
    }

    return {
      previewImage: fallbackImage,
      previewMedia: fallbackMedia,
    };
  }

  return {
    previewImage: bestMatch.media.file,
    previewMedia: bestMatch.media,
  };
}

export function parseGalleryQueryState(params: URLSearchParams): GalleryQueryState {
  const rawPage = Number(params.get("page") || "1");

  return {
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    room: normalizeOptionValue(params.get("room") || ""),
    doorStyles: parseMultiValue(params.get("doorStyle")),
    finishes: parseMultiValue(params.get("finish")),
    countertops: parseMultiValue(params.get("countertop")),
    flooringOnly: isTruthyFlag(params.get("flooring")),
  };
}

export function serializeMultiValue(values: string[]): string | null {
  const normalized = uniqueNormalizedList(values);
  return normalized.length ? normalized.join(",") : null;
}

export function toggleMultiValue(values: string[], value: string): string[] {
  const normalizedValue = normalizeOptionValue(value);
  if (!normalizedValue) return values;

  if (values.includes(normalizedValue)) {
    return values.filter((item) => item !== normalizedValue);
  }

  return [...values, normalizedValue];
}

export function filterGalleryProjects(
  projects: GalleryProjectItemData[],
  filters: GalleryFilterState,
): RankedGalleryProjectData[] {
  const effectiveFilters: GalleryFilterState = filters.flooringOnly
    ? {
        ...filters,
        doorStyles: [],
        finishes: [],
        countertops: [],
      }
    : filters;

  const totalSelectedFilterCount =
    effectiveFilters.doorStyles.length + effectiveFilters.finishes.length + effectiveFilters.countertops.length;
  const selectedCategoryCount =
    (effectiveFilters.doorStyles.length > 0 ? 1 : 0) +
    (effectiveFilters.finishes.length > 0 ? 1 : 0) +
    (effectiveFilters.countertops.length > 0 ? 1 : 0);

  return projects
    .map((project) => {
      const scopedMedia = getScopedMedia(project, effectiveFilters);
      const requiresScopedMedia = Boolean(effectiveFilters.room || effectiveFilters.flooringOnly);

      if (requiresScopedMedia && scopedMedia.length === 0) {
        return null;
      }

      const matchedDoorStyles = effectiveFilters.doorStyles.filter((value) => project.doorStyle === value);
      const matchedFinishes = effectiveFilters.finishes.filter((value) =>
        scopedMedia.some((media) => media.finishes.includes(value)),
      );
      const matchedCountertops = effectiveFilters.countertops.filter((value) =>
        scopedMedia.some((media) => media.countertop === value),
      );
      const matchedCategoryCount =
        (matchedDoorStyles.length > 0 ? 1 : 0) +
        (matchedFinishes.length > 0 ? 1 : 0) +
        (matchedCountertops.length > 0 ? 1 : 0);
      const matchedFilterCount = matchedDoorStyles.length + matchedFinishes.length + matchedCountertops.length;

      if (effectiveFilters.doorStyles.length > 0 && matchedDoorStyles.length === 0) {
        return null;
      }

      if (effectiveFilters.finishes.length > 0 && matchedFinishes.length === 0) {
        return null;
      }

      if (effectiveFilters.countertops.length > 0 && matchedCountertops.length === 0) {
        return null;
      }

      const { previewImage, previewMedia } = pickPreviewImage(project, filters, scopedMedia.length ? scopedMedia : project.media);

      return {
        ...project,
        previewImage,
        previewMedia,
        matchedFilterCount,
        matchedCategoryCount,
        totalSelectedFilterCount,
        fullMatch:
          totalSelectedFilterCount > 0 &&
          matchedCategoryCount === selectedCategoryCount &&
          matchedFilterCount === totalSelectedFilterCount,
      };
    })
    .filter((project): project is RankedGalleryProjectData => Boolean(project))
    .sort((left, right) => {
      if (selectedCategoryCount > 0) {
        if (left.fullMatch !== right.fullMatch) {
          return left.fullMatch ? -1 : 1;
        }

        if (left.matchedFilterCount !== right.matchedFilterCount) {
          return right.matchedFilterCount - left.matchedFilterCount;
        }

        if (left.matchedCategoryCount !== right.matchedCategoryCount) {
          return right.matchedCategoryCount - left.matchedCategoryCount;
        }
      }

      if (left.updatedAt !== right.updatedAt) {
        return right.updatedAt - left.updatedAt;
      }

      return left.projectTitle.localeCompare(right.projectTitle);
    });
}
