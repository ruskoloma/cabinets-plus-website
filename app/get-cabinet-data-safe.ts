import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { client } from "@/tina/__generated__/client";
import { CABINET_LIVE_QUERY } from "@/app/cabinet-live-query";
import { normalizeCabinetQueryData } from "@/components/cabinet-door/normalize-cabinet-query";
import type {
  CabinetListItem,
  CabinetQueryLikeResult,
} from "@/components/cabinet-door/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
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

let cabinetIndexCache: CabinetListItem[] | null = null;

export async function getCabinetDataSafe(slug: string): Promise<CabinetQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    const result = await client.request({
      query: CABINET_LIVE_QUERY,
      variables: { relativePath },
    }, {});

    const record = asRecord(result);

    return {
      data: normalizeCabinetQueryData(record?.data, relativePath),
      query: CABINET_LIVE_QUERY,
      variables: { relativePath },
    };
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "content", "cabinets", relativePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);

      return {
        data: normalizeCabinetQueryData({ cabinet: parsed.data }, relativePath),
        query: "",
        variables: {},
      };
    } catch {
      console.error(`Unable to load cabinet \"${slug}\" from Tina or local file.`, error);
      return {
        data: { cabinet: null },
        query: "",
        variables: {},
      };
    }
  }
}

export async function getCabinetIndexSafe(): Promise<CabinetListItem[]> {
  if (cabinetIndexCache) return cabinetIndexCache;

  try {
    const cabinetsDir = path.join(process.cwd(), "content", "cabinets");
    const files = (await fs.readdir(cabinetsDir)).filter((file) => file.endsWith(".md"));

    const rows = await Promise.all(
      files.map(async (filename) => {
        const fullPath = path.join(cabinetsDir, filename);
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
          doorStyle: asString(data.doorStyle)?.trim() || undefined,
          paint: asString(data.paint)?.trim() || undefined,
          stainType: asString(data.stainType)?.trim() || undefined,
        } as CabinetListItem;
      }),
    );

    cabinetIndexCache = rows.sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) return byName;
      return left.slug.localeCompare(right.slug);
    });

    return cabinetIndexCache;
  } catch (error) {
    console.error("Unable to read cabinet index from local files.", error);
    return [];
  }
}
