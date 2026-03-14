import {
  asRecord,
  asString,
  createStaticQueryResult,
  humanizeSlug,
  listMarkdownFiles,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { CABINET_LIVE_QUERY } from "@/app/cabinet-live-query";
import { normalizeCabinetQueryData } from "@/components/cabinet-door/normalize-cabinet-query";
import type {
  CabinetListItem,
  CabinetQueryLikeResult,
} from "@/components/cabinet-door/types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/\s+/g, "-");
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
      const frontmatter = await readMarkdownFrontmatter("cabinets", relativePath);
      return createStaticQueryResult(
        normalizeCabinetQueryData(
          {
            cabinet: withContentSysFields("cabinets", relativePath, frontmatter),
          },
          relativePath,
        ),
      );
    } catch {
      console.error(`Unable to load cabinet \"${slug}\" from Tina or local file.`, error);
      return createStaticQueryResult({ cabinet: null });
    }
  }
}

export async function getCabinetIndexSafe(): Promise<CabinetListItem[]> {
  if (cabinetIndexCache) return cabinetIndexCache;

  try {
    const files = await listMarkdownFiles("cabinets");
    const rows = await Promise.all(
      files.map(async (filename) => {
        const data = asRecord(await readMarkdownFrontmatter("cabinets", filename)) || {};

        const fallbackSlug = toSlug(filename);
        const slug = toSlug(asString(data.slug) || fallbackSlug);

        return {
          filename,
          slug,
          name: asString(data.name)?.trim() || humanizeSlug(slug),
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
