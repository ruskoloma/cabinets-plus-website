import fs from "node:fs/promises";
import type { MetadataRoute } from "next";
import {
  asBoolean,
  asString,
  contentPath,
  listMarkdownFiles,
  readMarkdownFrontmatter,
} from "@/app/lib/content";
import { getSiteUrl } from "@/app/lib/site-url";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

interface StaticRouteConfig {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

interface ContentRouteConfig {
  collection: string;
  routeBase: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const STATIC_ROUTES: StaticRouteConfig[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about-us", changeFrequency: "monthly", priority: 0.7 },
  { path: "/bathroom-remodel", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/cabinets", changeFrequency: "weekly", priority: 0.85 },
  { path: "/cabinets/catalog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact-us", changeFrequency: "monthly", priority: 0.8 },
  { path: "/countertops", changeFrequency: "weekly", priority: 0.85 },
  { path: "/countertops/catalog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/flooring", changeFrequency: "weekly", priority: 0.8 },
  { path: "/flooring/catalog", changeFrequency: "weekly", priority: 0.75 },
  { path: "/gallery", changeFrequency: "weekly", priority: 0.8 },
  { path: "/glass-enclosures", changeFrequency: "monthly", priority: 0.75 },
  { path: "/kitchen-remodel", changeFrequency: "monthly", priority: 0.8 },
  { path: "/magazine", changeFrequency: "monthly", priority: 0.55 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
];

const CONTENT_ROUTES: ContentRouteConfig[] = [
  { collection: "cabinets", routeBase: "/cabinets", changeFrequency: "monthly", priority: 0.65 },
  { collection: "collections", routeBase: "/collections", changeFrequency: "monthly", priority: 0.65 },
  { collection: "countertops", routeBase: "/countertops", changeFrequency: "monthly", priority: 0.65 },
  { collection: "flooring", routeBase: "/flooring/catalog", changeFrequency: "monthly", priority: 0.6 },
  { collection: "posts", routeBase: "/post", changeFrequency: "monthly", priority: 0.6 },
  { collection: "projects", routeBase: "/projects", changeFrequency: "monthly", priority: 0.7 },
];

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^(cabinets|collections|countertops|flooring|posts|projects)\//i, "")
    .replace(/\s+/g, "-");
}

function buildUrl(siteUrl: string, pathname: string): string {
  return new URL(pathname, `${siteUrl}/`).toString();
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string" || !value.trim()) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getFrontmatterDate(data: Record<string, unknown>): Date | undefined {
  return (
    parseDate(data.updatedAt) ||
    parseDate(data.sourceUpdatedAt) ||
    parseDate(data.date) ||
    parseDate(data.publishedAt)
  );
}

async function getContentRoutes(
  siteUrl: string,
  config: ContentRouteConfig,
): Promise<SitemapEntry[]> {
  const files = await listMarkdownFiles(config.collection);

  const entries = await Promise.all(
    files.map(async (filename): Promise<SitemapEntry | null> => {
      const data = await readMarkdownFrontmatter(config.collection, filename);

      if (asBoolean(data.draft) || asBoolean(data.published) === false) {
        return null;
      }

      const slug = toSlug(asString(data.slug) || filename);
      const stats = await fs.stat(contentPath(config.collection, filename));

      return {
        url: buildUrl(siteUrl, `${config.routeBase}/${slug}`),
        lastModified: getFrontmatterDate(data) || stats.mtime,
        changeFrequency: config.changeFrequency,
        priority: config.priority,
      };
    }),
  );

  return entries.filter((entry): entry is SitemapEntry => entry !== null);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    url: buildUrl(siteUrl, route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const dynamicEntries = (
    await Promise.all(CONTENT_ROUTES.map((config) => getContentRoutes(siteUrl, config)))
  ).flat();

  return [...staticEntries, ...dynamicEntries].sort((left, right) => left.url.localeCompare(right.url));
}
