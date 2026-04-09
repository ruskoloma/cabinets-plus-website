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
import { FLOORING_LIVE_QUERY } from "@/app/flooring-live-query";
import { normalizeFlooringQueryData } from "@/components/flooring/normalize-flooring-query";
import type { FlooringListItem, FlooringQueryLikeResult } from "@/components/flooring/types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/\s+/g, "-");
}

let flooringIndexCache: FlooringListItem[] | null = null;

export async function getFlooringDataSafe(slug: string): Promise<FlooringQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    const result = await client.request(
      {
        query: FLOORING_LIVE_QUERY,
        variables: { relativePath },
      },
      {},
    );

    const record = asRecord(result);

    return {
      data: normalizeFlooringQueryData(record?.data, relativePath),
      query: FLOORING_LIVE_QUERY,
      variables: { relativePath },
    };
  } catch (error) {
    try {
      const frontmatter = await readMarkdownFrontmatter("flooring", relativePath);
      return createStaticQueryResult(
        normalizeFlooringQueryData(
          {
            flooring: withContentSysFields("flooring", relativePath, frontmatter),
          },
          relativePath,
        ),
      );
    } catch {
      console.error(`Unable to load flooring "${slug}" from Tina or local file.`, error);
      return createStaticQueryResult({ flooring: null });
    }
  }
}

export async function getFlooringIndexSafe(): Promise<FlooringListItem[]> {
  if (flooringIndexCache) return flooringIndexCache;

  try {
    const files = await listMarkdownFiles("flooring");
    const rows = await Promise.all(
      files.map(async (filename) => {
        const data = asRecord(await readMarkdownFrontmatter("flooring", filename)) || {};

        const fallbackSlug = toSlug(filename);
        const slug = toSlug(asString(data.slug) || fallbackSlug);

        return {
          filename,
          slug,
          name: asString(data.name)?.trim() || humanizeSlug(slug),
          code: asString(data.code)?.trim() || "",
          picture: asString(data.picture)?.trim() || "",
          flooringType: asString(data.flooringType)?.trim() || undefined,
        } satisfies FlooringListItem;
      }),
    );

    flooringIndexCache = rows.sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) return byName;
      return left.slug.localeCompare(right.slug);
    });

    return flooringIndexCache;
  } catch (error) {
    console.error("Unable to read flooring index from local files.", error);
    return [];
  }
}
