import { normalizeOptionValue } from "@/components/special/cabinets-overview/normalize-cabinets-overview-query";
import { pickProjectPreviewForFilters, type GalleryFilterState } from "@/components/special/gallery-overview/filtering";
import { buildGalleryProjects } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewDataShape, GalleryProjectItemData, GalleryProjectMediaData } from "@/components/special/gallery-overview/types";
import type { CabinetData } from "@/components/special/cabinet-door/types";
import type { CountertopData } from "@/components/special/countertop/types";
import type { FlooringData } from "@/components/special/flooring/types";

export interface MatchedProjectCard {
  file: string;
  title: string;
  href: string;
  selectionIndex?: number;
  projectSource?: Record<string, unknown>;
  mediaSource?: Record<string, unknown>;
}

interface ExplicitProjectEntry {
  project: GalleryProjectItemData;
  selectionIndex: number;
}

interface RankedProjectEntry {
  project: GalleryProjectItemData;
  media?: GalleryProjectMediaData;
  score: number;
}

interface KeywordGroup {
  name: string;
  phrases: string[];
}

interface CabinetProjectFinishProfile {
  paints: string[];
  stains: string[];
}

const STOP_WORDS = new Set([
  "and",
  "are",
  "but",
  "for",
  "from",
  "into",
  "its",
  "look",
  "room",
  "rooms",
  "sample",
  "selection",
  "style",
  "surface",
  "surfaces",
  "that",
  "the",
  "their",
  "this",
  "with",
  "your",
]);

const COUNTERTOP_COLOR_GROUPS: KeywordGroup[] = [
  { name: "white", phrases: ["white", "ivory", "cream"] },
  { name: "gray", phrases: ["gray", "grey", "silver"] },
  { name: "black", phrases: ["black", "charcoal"] },
  { name: "warm", phrases: ["taupe", "beige", "greige", "brown", "tan", "sand", "gold", "warm"] },
  { name: "green", phrases: ["green", "emerald", "sage"] },
];

const COUNTERTOP_STYLE_GROUPS: KeywordGroup[] = [
  { name: "veined", phrases: ["vein", "veining", "veined", "marble", "marble look"] },
  { name: "subtle", phrases: ["soft", "subtle", "delicate", "airy", "gentle", "understated", "low contrast"] },
  { name: "dramatic", phrases: ["bold", "dramatic", "striking", "high contrast", "strong contrast"] },
  { name: "organic", phrases: ["organic", "natural", "flowing", "refined", "serene", "calm"] },
  { name: "flecked", phrases: ["fleck", "flecking", "speckle", "sparkle", "granular"] },
];

function isTruthyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(value: string): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    .filter((token, index, list) => list.indexOf(token) === index);
}

function countTokenMatches(tokens: string[], text: string, maxScore: number): number {
  if (!tokens.length || !text) return 0;

  const haystack = ` ${text} `;
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(` ${token} `)) score += 1;
    if (score >= maxScore) return maxScore;
  }

  return score;
}

function textIncludesPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizeSearchText(phrase);
  if (!normalizedPhrase) return false;
  return ` ${text} `.includes(` ${normalizedPhrase} `);
}

function getActiveKeywordGroups(text: string, groups: KeywordGroup[]): string[] {
  return groups
    .filter((group) => group.phrases.some((phrase) => textIncludesPhrase(text, phrase)))
    .map((group) => group.name);
}

function scoreKeywordAlignment(activeGroups: string[], text: string, groups: KeywordGroup[], points: number): number {
  let score = 0;

  for (const activeGroup of activeGroups) {
    const group = groups.find((entry) => entry.name === activeGroup);
    if (!group) continue;

    if (group.phrases.some((phrase) => textIncludesPhrase(text, phrase))) {
      score += points;
    }
  }

  return score;
}

function buildProjectSearchText(project: GalleryProjectItemData): string {
  const rawProject = project.rawProject || {};
  const description = isTruthyString(rawProject.description) ? rawProject.description : "";
  const notes = isTruthyString(rawProject.notes) ? rawProject.notes : "";

  return normalizeSearchText([
    project.projectTitle,
    description,
    notes,
    ...project.media.map((item) => item.label),
    ...project.media.map((item) => item.description),
  ].join(" "));
}

function inferCountertopType(countertop: CountertopData, productText: string): string {
  const explicitType = normalizeOptionValue(countertop.countertopType || "");
  if (explicitType) return explicitType;

  const inferredTypes: Array<{ value: string; phrases: string[] }> = [
    { value: "soapstone", phrases: ["soapstone"] },
    { value: "quartzite", phrases: ["quartzite"] },
    { value: "granite", phrases: ["granite"] },
    { value: "marble", phrases: ["marble"] },
    { value: "porcelain", phrases: ["porcelain"] },
    { value: "butcher block", phrases: ["butcher block"] },
    {
      value: "quartz",
      phrases: [
        "quartz",
        "calacatta",
        "carrara",
        "taj",
        "laza",
        "ibiza",
        "brezze",
        "platinum",
        "emerald",
        "highlight",
      ],
    },
  ];

  const matched = inferredTypes.find((entry) => entry.phrases.some((phrase) => textIncludesPhrase(productText, phrase)));
  return matched?.value || "";
}

function buildProjectCard(
  project: GalleryProjectItemData,
  matchedMedia: GalleryProjectMediaData | undefined,
  selectionIndex?: number,
): MatchedProjectCard | null {
  const file = matchedMedia?.file?.trim() || project.coverImage?.trim() || "";
  if (!file || !project.projectSlug) return null;

  return {
    file,
    title: project.projectTitle || "Project",
    href: `/projects/${project.projectSlug}`,
    selectionIndex,
    projectSource: project.rawProject,
    mediaSource: matchedMedia?.rawMedia,
  };
}

function addUniqueValue(target: string[], value: string): void {
  if (!value || target.includes(value)) return;
  target.push(value);
}

function textIncludesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => textIncludesPhrase(text, phrase));
}

function buildCabinetProjectFinishProfile(cabinet: CabinetData): CabinetProjectFinishProfile {
  const explicitPaint = normalizeOptionValue(cabinet.paint || "");
  const explicitStain = normalizeOptionValue(cabinet.stainType || "");
  const cabinetText = normalizeSearchText([
    cabinet.name || "",
    cabinet.code || "",
    cabinet.paint || "",
    cabinet.stainType || "",
  ].join(" "));
  const paints: string[] = [];
  const stains: string[] = [];

  const hasWhiteOak = textIncludesAny(cabinetText, ["white oak"]);
  const hasNaturalWood = hasWhiteOak || textIncludesAny(cabinetText, ["oak", "walnut", "hickory", "timber"]);
  const hasBlue = textIncludesAny(cabinetText, ["navy", "blue"]);
  const hasGreen = textIncludesAny(cabinetText, ["jade", "sage", "moss", "green"]);
  const hasBlack = textIncludesAny(cabinetText, ["charcoal", "ebony", "midnight", "black"]);
  const hasGray = textIncludesAny(cabinetText, ["gray", "grey", "ash", "mist", "dove", "cinder", "slate"]);
  const hasWarmNeutral = textIncludesAny(cabinetText, ["oatmeal", "fawn", "karmel", "caramel", "clemento", "toffee"]);
  const hasSoftWhite = textIncludesAny(cabinetText, ["ivory", "antique white", "off white", "blanco", "cream"]);
  const hasPureWhite = textIncludesAny(cabinetText, ["white", "bright white", "swan white", "designer white", "frost"])
    && !hasWhiteOak
    && !hasSoftWhite;
  const hasFairyTone = textIncludesAny(cabinetText, ["fairy"]);
  const hasSpecificNamedFinish =
    hasNaturalWood || hasBlue || hasGreen || hasBlack || hasGray || hasWarmNeutral || hasSoftWhite || hasPureWhite;

  const includeExplicitPaint =
    explicitPaint &&
    explicitPaint !== "custom paint" &&
    !(hasNaturalWood && explicitPaint === "white");

  if (includeExplicitPaint) addUniqueValue(paints, explicitPaint);
  if (explicitStain) addUniqueValue(stains, explicitStain);

  if (hasNaturalWood) addUniqueValue(paints, "timber");
  if (hasBlack) addUniqueValue(paints, "black");
  if (hasBlue) addUniqueValue(paints, "blue");
  if (hasGreen) addUniqueValue(paints, "green");
  if (hasGray) addUniqueValue(paints, "gray");
  if (hasSoftWhite) addUniqueValue(paints, "off white");
  if (hasPureWhite) addUniqueValue(paints, "white");
  if (hasWarmNeutral) addUniqueValue(paints, "brown");

  if ((explicitPaint === "custom paint" && (!hasSpecificNamedFinish || hasWarmNeutral || hasFairyTone)) || hasFairyTone) {
    addUniqueValue(paints, "custom paint");
  }

  if (!paints.length && explicitPaint) addUniqueValue(paints, explicitPaint);

  return {
    paints,
    stains,
  };
}

function buildCabinetPreviewFilters(cabinet: CabinetData): GalleryFilterState {
  const finishProfile = buildCabinetProjectFinishProfile(cabinet);
  const finishes = [...finishProfile.paints, ...finishProfile.stains];
  const doorStyle = normalizeOptionValue(cabinet.doorStyle || "");

  return {
    room: "",
    doorStyles: doorStyle ? [doorStyle] : [],
    finishes,
    countertops: [],
    flooringOnly: false,
  };
}

function buildCountertopPreviewFilters(countertop: CountertopData): GalleryFilterState {
  const countertops = [inferCountertopType(countertop, normalizeSearchText([
    countertop.name || "",
    countertop.description || "",
    countertop.countertopType || "",
  ].join(" ")))].filter(Boolean);

  return {
    room: "",
    doorStyles: [],
    finishes: [],
    countertops,
    flooringOnly: false,
  };
}

function buildFlooringPreviewFilters(): GalleryFilterState {
  return {
    room: "",
    doorStyles: [],
    finishes: [],
    countertops: [],
    flooringOnly: true,
  };
}

function buildExplicitProjectCards(
  entries: ExplicitProjectEntry[],
  filters: GalleryFilterState,
  maxItems: number,
): MatchedProjectCard[] {
  return entries
    .slice(0, maxItems)
    .map(({ project, selectionIndex }) => {
      const preview = pickProjectPreviewForFilters(project, filters);
      return buildProjectCard(project, preview.previewMedia || undefined, selectionIndex);
    })
    .filter((item): item is MatchedProjectCard => Boolean(item));
}

function pickTopProjectCards(entries: RankedProjectEntry[], maxItems: number): MatchedProjectCard[] {
  const results: MatchedProjectCard[] = [];
  const seenHrefs = new Set<string>();
  const seenFiles = new Set<string>();

  for (const entry of entries) {
    if (results.length >= maxItems) break;
    const candidate = buildProjectCard(entry.project, entry.media);
    if (!candidate) continue;
    if (seenHrefs.has(candidate.href) || seenFiles.has(candidate.file)) continue;

    seenHrefs.add(candidate.href);
    seenFiles.add(candidate.file);
    results.push(candidate);
  }

  return results;
}

function sortRankedProjects(entries: RankedProjectEntry[]): RankedProjectEntry[] {
  return [...entries].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.project.updatedAt !== left.project.updatedAt) return right.project.updatedAt - left.project.updatedAt;
    return left.project.projectTitle.localeCompare(right.project.projectTitle);
  });
}

function resolveProjectReference(reference: string): string {
  return reference
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
    .replace(/^\//, "")
    .replace(/\s+/g, "-");
}

function resolveExplicitProjectEntries(
  references: Array<string | null> | null | undefined,
  projects: GalleryProjectItemData[],
): ExplicitProjectEntry[] {
  if (!Array.isArray(references) || references.length === 0) return [];

  const bySlug = new Map(projects.map((project) => [project.projectSlug, project]));
  const byId = new Map(
    projects
      .map((project) => {
        const rawId = project.rawProject?.id;
        return typeof rawId === "string" || typeof rawId === "number"
          ? [String(rawId), project] as const
          : null;
      })
      .filter((entry): entry is readonly [string, GalleryProjectItemData] => Boolean(entry)),
  );

  return references
    .map((value, index) => {
      if (!isTruthyString(value)) return null;
      const normalizedReference = resolveProjectReference(value);
      const project = bySlug.get(normalizedReference) || byId.get(value.trim()) || null;
      return project ? { project, selectionIndex: index } : null;
    })
    .filter((entry, index, list): entry is ExplicitProjectEntry => {
      if (!entry) return false;
      return list.findIndex((candidate) => candidate?.project === entry.project) === index;
    });
}

function normalizeProductReferencePath(value: unknown, collectionName: "cabinets" | "countertops" | "flooring"): string {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withCollection = trimmed
      .replace(/^\/+/, "")
      .replace(/^content\//i, "")
      .replace(new RegExp(`^${collectionName}/`, "i"), "");
    const filename = withCollection.endsWith(".md") ? withCollection : `${withCollection}.md`;
    return `content/${collectionName}/${filename}`.toLowerCase();
  }

  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  if (!record) return "";

  const sys = record._sys && typeof record._sys === "object" ? (record._sys as Record<string, unknown>) : null;
  const reference =
    (typeof sys?.relativePath === "string" && sys.relativePath) ||
    (typeof sys?.filename === "string" && sys.filename) ||
    (typeof record.slug === "string" && record.slug) ||
    "";

  return normalizeProductReferencePath(reference, collectionName);
}

function cabinetReferencePaths(cabinet: CabinetData): Set<string> {
  const sys = cabinet._sys;
  return new Set(
    [
      normalizeProductReferencePath(cabinet.slug || "", "cabinets"),
      normalizeProductReferencePath(sys?.relativePath || "", "cabinets"),
      normalizeProductReferencePath(sys?.filename || "", "cabinets"),
    ].filter(Boolean),
  );
}

function projectUsesCabinet(project: GalleryProjectItemData, cabinet: CabinetData): boolean {
  const rawProject = project.rawProject || {};
  const cabinetProducts = Array.isArray(rawProject.cabinetProducts) ? rawProject.cabinetProducts : [];
  if (!cabinetProducts.length) return false;

  const cabinetPaths = cabinetReferencePaths(cabinet);
  if (!cabinetPaths.size) return false;

  return cabinetProducts.some((item) => {
    if (!item || typeof item !== "object") return false;
    const cabinetReference = (item as Record<string, unknown>).cabinet;
    const normalizedReference = normalizeProductReferencePath(cabinetReference, "cabinets");
    return Boolean(normalizedReference && cabinetPaths.has(normalizedReference));
  });
}

export function buildCabinetProjectMatches(
  cabinet: CabinetData,
  overviewData: GalleryOverviewDataShape,
  maxItems = 3,
): MatchedProjectCard[] {
  const projects = buildGalleryProjects(overviewData);
  if (!projects.length) return [];

  const previewFilters = buildCabinetPreviewFilters(cabinet);
  return projects
    .filter((project) => projectUsesCabinet(project, cabinet))
    .slice(0, maxItems)
    .map((project) => {
      const preview = pickProjectPreviewForFilters(project, previewFilters);
      return buildProjectCard(project, preview.previewMedia || undefined);
    })
    .filter((item): item is MatchedProjectCard => Boolean(item));
}

function scoreCountertopMedia(
  media: GalleryProjectMediaData,
  mediaText: string,
  countertopType: string,
  colorGroups: string[],
  styleGroups: string[],
  countertopTokens: string[],
): number {
  let score = 0;

  if (countertopType && media.countertop === countertopType) score += media.countertopPriority ? 10 : 7;
  if (!countertopType && media.countertop) score += 2;
  if (media.countertopPriority) score += 2;

  score += scoreKeywordAlignment(colorGroups, mediaText, COUNTERTOP_COLOR_GROUPS, 2);
  score += scoreKeywordAlignment(styleGroups, mediaText, COUNTERTOP_STYLE_GROUPS, 1);
  score += countTokenMatches(countertopTokens, mediaText, 4);

  return score;
}

export function buildCountertopProjectMatches(
  countertop: CountertopData,
  overviewData: GalleryOverviewDataShape,
  maxItems = 3,
): MatchedProjectCard[] {
  const projects = buildGalleryProjects(overviewData);
  if (!projects.length) return [];

  const explicitProjects = resolveExplicitProjectEntries(countertop.relatedProjects, projects);
  const previewFilters = buildCountertopPreviewFilters(countertop);
  if (explicitProjects.length) {
    return buildExplicitProjectCards(explicitProjects, previewFilters, maxItems);
  }

  const countertopText = normalizeSearchText([
    countertop.name || "",
    countertop.description || "",
    countertop.countertopType || "",
  ].join(" "));
  const countertopTokens = tokenizeSearchText(countertopText);
  const countertopType = inferCountertopType(countertop, countertopText);
  const activeColorGroups = getActiveKeywordGroups(countertopText, COUNTERTOP_COLOR_GROUPS);
  const activeStyleGroups = getActiveKeywordGroups(countertopText, COUNTERTOP_STYLE_GROUPS);

  const ranked = sortRankedProjects(
    projects.map((project) => {
      const projectText = buildProjectSearchText(project);
      const mediaRanking = project.media
        .map((media) => {
          const mediaText = normalizeSearchText(`${media.label} ${media.description}`);
          return {
            media,
            score: scoreCountertopMedia(
              media,
              mediaText,
              countertopType,
              activeColorGroups,
              activeStyleGroups,
              countertopTokens,
            ),
          };
        })
        .sort((left, right) => right.score - left.score);

      const bestMedia = mediaRanking[0];
      let score = bestMedia?.score || 0;

      if (countertopType && project.countertops.includes(countertopType)) score += 6;

      score += scoreKeywordAlignment(activeColorGroups, projectText, COUNTERTOP_COLOR_GROUPS, 2);
      score += scoreKeywordAlignment(activeStyleGroups, projectText, COUNTERTOP_STYLE_GROUPS, 2);
      score += countTokenMatches(countertopTokens, projectText, 6);

      if (textIncludesPhrase(countertopText, "calacatta")) {
        if (textIncludesPhrase(projectText, "waterfall")) score += 2;
        if (textIncludesPhrase(projectText, "veined")) score += 2;
      }

      if (textIncludesPhrase(countertopText, "carrara")) {
        if (textIncludesPhrase(projectText, "subtle")) score += 2;
        if (textIncludesPhrase(projectText, "gray veining")) score += 2;
      }

      if (textIncludesPhrase(countertopText, "taj") || textIncludesPhrase(countertopText, "coastal")) {
        if (textIncludesPhrase(projectText, "warm wood")) score += 2;
        if (textIncludesPhrase(projectText, "brass")) score += 1;
        if (textIncludesPhrase(projectText, "organic")) score += 1;
      }

      if (textIncludesPhrase(countertopText, "black")) {
        if (textIncludesPhrase(projectText, "black")) score += 2;
        if (textIncludesPhrase(projectText, "high contrast")) score += 1;
      }

      return {
        project,
        media: bestMedia?.media,
        score,
      };
    }).filter((entry) => entry.score > 0),
  );

  return pickTopProjectCards(ranked, maxItems);
}

export function buildFlooringProjectMatches(
  flooring: FlooringData,
  overviewData: GalleryOverviewDataShape,
  maxItems = 3,
): MatchedProjectCard[] {
  const projects = buildGalleryProjects(overviewData);
  if (!projects.length) return [];

  if (!Array.isArray(flooring.relatedProjects) || flooring.relatedProjects.length === 0) {
    return [];
  }

  const explicitProjects = resolveExplicitProjectEntries(flooring.relatedProjects, projects);
  const previewFilters = buildFlooringPreviewFilters();
  return buildExplicitProjectCards(explicitProjects, previewFilters, maxItems);
}
