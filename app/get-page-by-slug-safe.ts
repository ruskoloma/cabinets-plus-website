import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getPageDataSafe, type PageQueryLikeResult } from "./get-page-data-safe";

function findPageFileBySlug(slug: string): string | null {
  const pagesDir = path.join(process.cwd(), "content", "pages");
  let entries: string[];
  try {
    entries = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".md"));
  } catch {
    return null;
  }

  for (const entry of entries) {
    const filePath = path.join(pagesDir, entry);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data } = matter(raw);
      if (typeof data.slug === "string" && data.slug === slug) {
        return entry;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function getPageBySlugSafe(slug: string): Promise<PageQueryLikeResult | null> {
  const filename = findPageFileBySlug(slug);
  if (!filename) return null;
  return getPageDataSafe(filename);
}

export function getAllPageSlugs(): string[] {
  const pagesDir = path.join(process.cwd(), "content", "pages");
  let entries: string[];
  try {
    entries = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const slugs: string[] = [];
  for (const entry of entries) {
    const filePath = path.join(pagesDir, entry);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data } = matter(raw);
      const slug = typeof data.slug === "string" ? data.slug : entry.replace(/\.md$/, "");
      if (slug && slug !== "home") {
        slugs.push(slug);
      }
    } catch {
      continue;
    }
  }

  return slugs;
}
