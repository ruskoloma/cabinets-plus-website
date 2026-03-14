import { normalizeOptionValue } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import { buildGalleryProjects } from "@/components/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewDataShape } from "@/components/gallery-overview/types";
import type {
  CabinetListItem,
  CatalogSettingsData,
  ProjectFeatureSummary,
  ProjectGalleryItem,
  ProjectMaterialCardData,
  ProjectOverviewItem,
  ProjectRelatedCardData,
} from "./types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
    .replace(/\s+/g, "-");
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanList(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => normalizeOptionValue(value || ""))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function countValues(values: Array<string | null | undefined>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const rawValue of values) {
    const value = normalizeOptionValue(rawValue || "");
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return counts;
}

function pickMostCommon(values: Array<string | null | undefined>): string {
  const counts = countValues(values);
  let winner = "";
  let winnerCount = -1;

  for (const [value, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }

  return winner;
}

function humanizeFileName(file: string): string {
  const trimmed = file.split("?")[0].split("/").pop() || file;
  return titleCase(trimmed.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
}

function inferDoorStyleFromText(content: string, availableValues: string[]): string {
  const normalized = normalizeOptionValue(content);
  if (!normalized) return "";

  const preferredMatches = [...availableValues].sort((left, right) => right.length - left.length);
  for (const value of preferredMatches) {
    if (value && normalized.includes(value)) return value;
  }

  if (normalized.includes("slab")) return "flat panel";
  if (normalized.includes("flat panel") || normalized.includes("flat-front") || normalized.includes("flat front")) {
    return "flat panel";
  }
  if (normalized.includes("slim shaker")) return "slim shaker";
  if (normalized.includes("elegant shaker")) return "elegant shaker";
  if (normalized.includes("shaker")) return "shaker";

  return "";
}

function getProjectSearchableText(project: ProjectOverviewItem): string {
  const media = Array.isArray(project.media) ? project.media : [];

  return [
    project.title || "",
    project.description || "",
    project.notes || "",
    ...media.map((item) => item?.label || ""),
    ...media.map((item) => item?.description || ""),
  ].join(" ");
}

function getFeatureSummary(project: ProjectOverviewItem, catalogSettings?: CatalogSettingsData | null): ProjectFeatureSummary {
  const mediaItems = (project.media || []).filter((item) => Boolean(item && item.file));
  const searchableText = getProjectSearchableText(project);
  const doorStyleValues = (catalogSettings?.doorStyles || []).map((option) => normalizeOptionValue(option.value));

  return {
    rooms: cleanList(mediaItems.map((item) => item?.room)),
    paints: cleanList(mediaItems.flatMap((item) => item?.cabinetPaints || [])),
    stains: cleanList(mediaItems.flatMap((item) => item?.cabinetStains || [])),
    countertops: cleanList(mediaItems.map((item) => item?.countertop)),
    flooring: mediaItems.some((item) => Boolean(item?.flooring)),
    doorStyle: inferDoorStyleFromText(searchableText, doorStyleValues),
  };
}

function getRawMediaField(
  media: NonNullable<ProjectOverviewItem["media"]>[number] | undefined,
  field: string,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  if (!media?.raw) return undefined;
  return tinaFieldFn(media.raw as Record<string, unknown>, field) || undefined;
}

function findFeaturedMedia(
  project: ProjectOverviewItem,
  predicate: (item: NonNullable<ProjectOverviewItem["media"]>[number]) => boolean,
  priority: (item: NonNullable<ProjectOverviewItem["media"]>[number]) => boolean,
) {
  const mediaItems = (project.media || []).filter((item) => Boolean(item && item.file));
  return mediaItems.find((item) => priority(item)) || mediaItems.find((item) => predicate(item));
}

function getDoorStyleOption(doorStyle: string, catalogSettings?: CatalogSettingsData | null) {
  return (catalogSettings?.doorStyles || []).find(
    (option) => normalizeOptionValue(option.value) === normalizeOptionValue(doorStyle),
  );
}

function getCountertopOption(countertop: string, catalogSettings?: CatalogSettingsData | null) {
  return (catalogSettings?.countertopTypes || []).find(
    (option) => normalizeOptionValue(option.value) === normalizeOptionValue(countertop),
  );
}

function scoreCabinetMatch(item: CabinetListItem, options: { doorStyle: string; paint: string; stain: string }) {
  let score = 0;

  if (options.doorStyle && normalizeOptionValue(item.doorStyle || "") === options.doorStyle) score += 5;
  if (options.paint && normalizeOptionValue(item.paint || "") === options.paint) score += 3;
  if (options.stain && normalizeOptionValue(item.stainType || "") === options.stain) score += 3;
  if (item.picture) score += 1;

  return score;
}

function pickCabinetMatch(project: ProjectOverviewItem, catalogSettings: CatalogSettingsData | null | undefined, cabinetIndex: CabinetListItem[]) {
  const summary = getFeatureSummary(project, catalogSettings);
  const dominantPaint = pickMostCommon(summary.paints);
  const dominantStain = pickMostCommon(summary.stains);

  let best: CabinetListItem | undefined;
  let bestScore = 0;

  for (const item of cabinetIndex) {
    const score = scoreCabinetMatch(item, {
      doorStyle: summary.doorStyle,
      paint: dominantPaint,
      stain: dominantStain,
    });

    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : undefined;
}

function buildCabinetSubtitle(project: ProjectOverviewItem, summary: ProjectFeatureSummary): string {
  const dominantPaint = pickMostCommon(summary.paints);
  const dominantStain = pickMostCommon(summary.stains);

  if (dominantPaint) return `${titleCase(dominantPaint)} finish`;
  if (dominantStain) return `${titleCase(dominantStain)} finish`;

  return project.address?.trim() || "Derived from project details";
}

function buildCountertopSubtitle(project: ProjectOverviewItem, summary: ProjectFeatureSummary): string {
  if (summary.rooms.length > 0) return `Featured across ${summary.rooms[0].toLowerCase()} spaces`;
  return project.address?.trim() || "Selected from project media";
}

function buildFlooringSubtitle(project: ProjectOverviewItem): string {
  return project.address?.trim() || "Shown in project media";
}

export function buildProjectGallery(project: ProjectOverviewItem): ProjectGalleryItem[] {
  const items: ProjectGalleryItem[] = [];
  const seen = new Set<string>();
  const title = project.title?.trim() || "Project";

  const primaryPicture = (project.primaryPicture || "").trim();
  if (primaryPicture && !seen.has(primaryPicture)) {
    seen.add(primaryPicture);
    items.push({
      file: primaryPicture,
      alt: title,
      sourceType: "primaryPicture",
    });
  }

  for (const media of project.media || []) {
    const file = (media?.file || "").trim();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    items.push({
      file,
      alt: media?.label?.trim() || title,
      sourceType: "media",
      source: media || undefined,
    });
  }

  return items;
}

export function buildMaterialCards(
  project: ProjectOverviewItem,
  catalogSettings: CatalogSettingsData | null | undefined,
  cabinetIndex: CabinetListItem[],
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): ProjectMaterialCardData[] {
  const summary = getFeatureSummary(project, catalogSettings);
  const cards: ProjectMaterialCardData[] = [];

  const featuredCabinetMedia = findFeaturedMedia(
    project,
    (item) => Boolean(item?.cabinetPaints?.length || item?.cabinetStains?.length),
    (item) => Boolean(item?.paintPriority || item?.stainPriority),
  );
  const cabinetMatch = pickCabinetMatch(project, catalogSettings, cabinetIndex);
  const doorStyleOption = getDoorStyleOption(summary.doorStyle, catalogSettings);

  if (cabinetMatch || doorStyleOption) {
    cards.push({
      kind: "cabinet",
      label: "Cabinet door",
      title: cabinetMatch?.name || doorStyleOption?.label || titleCase(summary.doorStyle || "Cabinet door"),
      subtitle: cabinetMatch?.code ? `#${cabinetMatch.code.replace(/^#+/, "")}` : buildCabinetSubtitle(project, summary),
      image: cabinetMatch?.picture || doorStyleOption?.image || featuredCabinetMedia?.file || project.primaryPicture || undefined,
      href: cabinetMatch ? `/cabinets/${cabinetMatch.slug}` : undefined,
      tinaField: getRawMediaField(featuredCabinetMedia, "cabinetPaints.0", tinaFieldFn)
        || getRawMediaField(featuredCabinetMedia, "cabinetStains.0", tinaFieldFn),
    });
  }

  const dominantCountertop = pickMostCommon(summary.countertops);
  const countertopOption = getCountertopOption(dominantCountertop, catalogSettings);
  const featuredCountertopMedia = findFeaturedMedia(
    project,
    (item) => Boolean(normalizeOptionValue(item?.countertop || "")),
    (item) => Boolean(item?.countertopPriority),
  );

  if (countertopOption || featuredCountertopMedia) {
    cards.push({
      kind: "countertop",
      label: "Countertop",
      title: countertopOption?.label || titleCase(dominantCountertop || "Countertop"),
      subtitle: buildCountertopSubtitle(project, summary),
      image: countertopOption?.image || featuredCountertopMedia?.file || project.primaryPicture || undefined,
      tinaField: getRawMediaField(featuredCountertopMedia, "countertop", tinaFieldFn),
    });
  }

  const featuredFlooringMedia = findFeaturedMedia(
    project,
    (item) => Boolean(item?.flooring),
    (item) => Boolean(item?.flooring),
  );

  if (summary.flooring && featuredFlooringMedia?.file) {
    cards.push({
      kind: "flooring",
      label: "Flooring",
      title: featuredFlooringMedia.label?.trim() || "Project flooring",
      subtitle: buildFlooringSubtitle(project),
      image: featuredFlooringMedia.file,
      tinaField: getRawMediaField(featuredFlooringMedia, "flooring", tinaFieldFn),
    });
  }

  return cards;
}

function buildSimilarityScore(current: ProjectFeatureSummary, candidate: ProjectFeatureSummary): number {
  let score = 0;

  for (const room of candidate.rooms) {
    if (current.rooms.includes(room)) score += 2;
  }
  for (const paint of candidate.paints) {
    if (current.paints.includes(paint)) score += 2;
  }
  for (const stain of candidate.stains) {
    if (current.stains.includes(stain)) score += 2;
  }
  for (const countertop of candidate.countertops) {
    if (current.countertops.includes(countertop)) score += 2;
  }
  if (candidate.flooring && current.flooring) score += 1;
  if (candidate.doorStyle && candidate.doorStyle === current.doorStyle) score += 2;

  return score;
}

export function buildRelatedProjectCards(
  project: ProjectOverviewItem,
  overviewData: GalleryOverviewDataShape,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
  limit = 3,
): ProjectRelatedCardData[] {
  const currentSlug = toSlug(project.slug || project._sys?.filename || project.title || "");
  const projectCards = buildGalleryProjects(overviewData);
  const projectMap = new Map(projectCards.map((item) => [item.projectSlug, item]));
  const results: ProjectRelatedCardData[] = [];
  const used = new Set<string>();
  const rawProject = project as unknown as Record<string, unknown>;
  const currentSummary = getFeatureSummary(project, overviewData.catalogSettings);

  (project.relatedProjects || []).forEach((value, index) => {
    const slug = toSlug(value || "");
    const match = projectMap.get(slug);
    if (!slug || !match || used.has(slug) || slug === currentSlug) return;

    used.add(slug);
    results.push({
      slug,
      title: match.projectTitle,
      image: match.coverImage,
      tinaField: tinaFieldFn(rawProject, `relatedProjects.${index}`) || undefined,
    });
  });

  if (results.length >= limit) return results.slice(0, limit);

  const candidates = projectCards
    .filter((item) => item.projectSlug !== currentSlug && !used.has(item.projectSlug))
    .map((item) => ({
      item,
      score: buildSimilarityScore(currentSummary, {
        rooms: item.rooms,
        paints: item.paints,
        stains: item.stains,
        countertops: item.countertops,
        flooring: item.flooring,
        doorStyle: item.doorStyle,
      }),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.item.projectTitle.localeCompare(right.item.projectTitle);
    });

  for (const { item } of candidates) {
    if (results.length >= limit) break;
    used.add(item.projectSlug);
    results.push({
      slug: item.projectSlug,
      title: item.projectTitle,
      image: item.coverImage,
    });
  }

  return results.slice(0, limit);
}

export function getProjectSlug(project: ProjectOverviewItem, fallbackSlug: string): string {
  return toSlug(project.slug || project._sys?.filename || fallbackSlug);
}

export function getProjectHeading(project: ProjectOverviewItem, fallbackSlug: string): string {
  return project.title?.trim() || titleCase(getProjectSlug(project, fallbackSlug));
}

export function getProjectDescription(project: ProjectOverviewItem): string {
  return project.description?.trim() || "";
}

export function getProjectPrimaryField(
  project: ProjectOverviewItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  const rawProject = project as unknown as Record<string, unknown>;
  return tinaFieldFn(rawProject, "primaryPicture") || undefined;
}

export function getProjectGalleryField(
  project: ProjectOverviewItem,
  item: ProjectGalleryItem,
  tinaFieldFn: (value: Record<string, unknown>, field?: string) => string | undefined,
): string | undefined {
  if (item.sourceType === "primaryPicture") return getProjectPrimaryField(project, tinaFieldFn);
  if (!item.source?.raw) return undefined;
  return tinaFieldFn(item.source.raw as Record<string, unknown>, "file") || undefined;
}

export function getProjectGalleryAlt(project: ProjectOverviewItem, item: ProjectGalleryItem): string {
  if (item.alt.trim()) return item.alt.trim();
  return humanizeFileName(item.file);
}
