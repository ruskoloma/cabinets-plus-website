import {
  asRecord,
  asString,
  humanizeSlug,
  listMarkdownFiles,
  readMarkdownDocument,
} from "@/app/lib/content";
import { getCabinetIndexSafe } from "@/app/get-cabinet-data-safe";
import { getCountertopIndexSafe } from "@/app/get-countertop-data-safe";

export interface SearchProductResult {
  type: "product";
  href: string;
  title: string;
  subtitle: string;
  image: string;
  kind: "cabinet" | "countertop";
  score: number;
}

export interface SearchProjectResult {
  type: "project";
  href: string;
  title: string;
  image: string;
  score: number;
}

export interface SearchArticleResult {
  type: "article";
  href: string;
  title: string;
  image: string;
  score: number;
}

export interface SearchResultsData {
  query: string;
  products: SearchProductResult[];
  projects: SearchProjectResult[];
  articles: SearchArticleResult[];
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
    .replace(/^posts\//i, "")
    .replace(/\s+/g, "-");
}

function buildScore(query: string, fields: string[]): number {
  if (!query) return 0;

  let score = 0;
  const compactQuery = query.replace(/\s+/g, "");

  fields.forEach((field, index) => {
    const normalized = normalizeSearchText(field);
    if (!normalized) return;

    const compactField = normalized.replace(/\s+/g, "");
    const weight = Math.max(1, 6 - index);

    if (normalized === query || compactField === compactQuery) {
      score += 140 * weight;
      return;
    }

    if (normalized.startsWith(query) || compactField.startsWith(compactQuery)) {
      score += 90 * weight;
    }

    if (normalized.includes(query) || compactField.includes(compactQuery)) {
      score += 45 * weight;
    }

    const queryTokens = query.split(" ").filter(Boolean);
    queryTokens.forEach((token) => {
      if (normalized.includes(token) || compactField.includes(token)) {
        score += 12 * weight;
      }
    });
  });

  return score;
}

function compareByScoreAndTitle<T extends { score: number; title: string }>(left: T, right: T) {
  if (right.score !== left.score) return right.score - left.score;
  return left.title.localeCompare(right.title);
}

export async function getSearchResultsSafe(rawQuery: string): Promise<SearchResultsData> {
  const query = normalizeSearchText(rawQuery || "");
  if (!query) {
    return { query: "", products: [], projects: [], articles: [] };
  }

  const [cabinets, countertops, projectFiles, postFiles] = await Promise.all([
    getCabinetIndexSafe(),
    getCountertopIndexSafe(),
    listMarkdownFiles("projects"),
    listMarkdownFiles("posts"),
  ]);

  const cabinetProducts = cabinets
    .map((item): SearchProductResult | null => {
      const score = buildScore(query, [item.name, item.code, item.doorStyle || "", item.paint || "", item.stainType || ""]);
      if (score <= 0) return null;

      return {
        type: "product",
        href: `/cabinets/${item.slug}`,
        title: item.name,
        subtitle: item.code,
        image: item.picture,
        kind: "cabinet",
        score,
      };
    })
    .filter((item): item is SearchProductResult => Boolean(item));

  const countertopProducts = countertops
    .map((item): SearchProductResult | null => {
      const score = buildScore(query, [item.name, item.code, item.countertopType || ""]);
      if (score <= 0) return null;

      return {
        type: "product",
        href: `/countertops/${item.slug}`,
        title: item.name,
        subtitle: item.code,
        image: item.picture,
        kind: "countertop",
        score,
      };
    })
    .filter((item): item is SearchProductResult => Boolean(item));

  const products = [...cabinetProducts, ...countertopProducts].sort(compareByScoreAndTitle);

  const projects = (
    await Promise.all(
      projectFiles
        .filter((filename) => !filename.startsWith("_"))
        .map(async (filename) => {
          const { data, content } = await readMarkdownDocument("projects", filename);
          const record = asRecord(data) || {};
          const slug = toSlug(asString(record.slug) || filename);
          const title = asString(record.title)?.trim() || humanizeSlug(slug);
          const media = Array.isArray(record.media) ? record.media : [];
          const firstMedia = media.find((item) => {
            const mediaRecord = asRecord(item);
            return Boolean(asString(mediaRecord?.file)?.trim());
          });
          const firstMediaFile = asString(asRecord(firstMedia)?.file)?.trim() || "";
          const image = firstMediaFile;
          const score = buildScore(query, [
            title,
            asString(record.address) || "",
            asString(record.description) || "",
            asString(record.notes) || "",
            content,
            ...media.flatMap((item) => {
              const mediaRecord = asRecord(item);
              return [asString(mediaRecord?.label) || "", asString(mediaRecord?.description) || ""];
            }),
          ]);

          if (score <= 0 || !slug || !image) return null;

          return {
            type: "project" as const,
            href: `/projects/${slug}`,
            title,
            image,
            score,
          };
        }),
    )
  )
    .filter((item): item is SearchProjectResult => Boolean(item))
    .sort(compareByScoreAndTitle);

  const articles = (
    await Promise.all(
      postFiles
        .filter((filename) => !filename.startsWith("_"))
        .map(async (filename) => {
          const { data, content } = await readMarkdownDocument("posts", filename);
          const record = asRecord(data) || {};
          const slug = toSlug(filename);
          const title = asString(record.title)?.trim() || humanizeSlug(slug);
          const thumbnail = asString(record.thumbnail)?.trim() || "";
          const score = buildScore(query, [
            title,
            asString(record.subtitle) || "",
            asString(record.excerpt) || "",
            content,
          ]);

          if (score <= 0 || !thumbnail) return null;

          return {
            type: "article" as const,
            href: `/post/${slug}`,
            title,
            image: thumbnail,
            score,
          };
        }),
    )
  )
    .filter((item): item is SearchArticleResult => Boolean(item))
    .sort(compareByScoreAndTitle);

  return {
    query: rawQuery.trim(),
    products,
    projects,
    articles,
  };
}
