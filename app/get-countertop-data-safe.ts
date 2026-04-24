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
import { COUNTERTOP_LIVE_QUERY } from "@/app/countertop-live-query";
import { normalizeCountertopQueryData } from "@/components/special/countertop/normalize-countertop-query";
import type { CountertopListItem, CountertopQueryLikeResult } from "@/components/special/countertop/types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/\s+/g, "-");
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
      const frontmatter = await readMarkdownFrontmatter("countertops", relativePath);
      return createStaticQueryResult(
        normalizeCountertopQueryData(
          {
            countertop: withContentSysFields("countertops", relativePath, frontmatter),
          },
          relativePath,
        ),
      );
    } catch {
      console.error(`Unable to load countertop "${slug}" from Tina or local file.`, error);
      return createStaticQueryResult({ countertop: null });
    }
  }
}

export async function getCountertopIndexSafe(): Promise<CountertopListItem[]> {
  if (countertopIndexCache) return countertopIndexCache;

  try {
    const files = await listMarkdownFiles("countertops");
    const rows = await Promise.all(
      files.map(async (filename) => {
        const data = asRecord(await readMarkdownFrontmatter("countertops", filename)) || {};

        const fallbackSlug = toSlug(filename);
        const slug = toSlug(asString(data.slug) || fallbackSlug);

        return {
          filename,
          slug,
          name: asString(data.name)?.trim() || humanizeSlug(slug),
          code: asString(data.code)?.trim() || "",
          picture: asString(data.picture)?.trim() || "",
          countertopType: asString(data.countertopType)?.trim() || undefined,
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
