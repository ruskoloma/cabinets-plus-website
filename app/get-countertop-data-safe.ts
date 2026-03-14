import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { client } from "@/tina/__generated__/client";
import { COUNTERTOP_LIVE_QUERY } from "@/app/countertop-live-query";
import { normalizeCountertopQueryData } from "@/components/countertop/normalize-countertop-query";
import type { CountertopListItem, CountertopQueryLikeResult } from "@/components/countertop/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/\s+/g, "-");
}

function toHumanizedName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

let countertopIndexCache: CountertopListItem[] | null = null;

export async function getCountertopDataSafe(slug: string): Promise<CountertopQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    const result = await client.request(
      {
        query: COUNTERTOP_LIVE_QUERY,
        variables: { relativePath },
      },
      {},
    );

    const record = asRecord(result);

    return {
      data: normalizeCountertopQueryData(record?.data, relativePath),
      query: COUNTERTOP_LIVE_QUERY,
      variables: { relativePath },
    };
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "content", "countertops", relativePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);

      return {
        data: normalizeCountertopQueryData({ countertop: parsed.data }, relativePath),
        query: "",
        variables: {},
      };
    } catch {
      console.error(`Unable to load countertop "${slug}" from Tina or local file.`, error);
      return {
        data: { countertop: null },
        query: "",
        variables: {},
      };
    }
  }
}

export async function getCountertopIndexSafe(): Promise<CountertopListItem[]> {
  if (countertopIndexCache) return countertopIndexCache;

  try {
    const countertopsDir = path.join(process.cwd(), "content", "countertops");
    const files = (await fs.readdir(countertopsDir)).filter((file) => file.endsWith(".md"));

    const rows = await Promise.all(
      files.map(async (filename) => {
        const fullPath = path.join(countertopsDir, filename);
        const raw = await fs.readFile(fullPath, "utf8");
        const parsed = matter(raw);
        const data = asRecord(parsed.data) || {};

        const fallbackSlug = toSlug(filename);
        const slug = toSlug(asString(data.slug) || fallbackSlug);

        return {
          filename,
          slug,
          name: asString(data.name)?.trim() || toHumanizedName(slug),
          code: asString(data.code)?.trim() || "",
          picture: asString(data.picture)?.trim() || "",
          countertopType: asString(data.countertopType)?.trim() || undefined,
          inStock: asBoolean(data.inStock),
          storeCollection: asString(data.storeCollection)?.trim() || undefined,
        } satisfies CountertopListItem;
      }),
    );

    countertopIndexCache = rows.sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) return byName;
      return left.slug.localeCompare(right.slug);
    });

    return countertopIndexCache;
  } catch (error) {
    console.error("Unable to read countertop index from local files.", error);
    return [];
  }
}
