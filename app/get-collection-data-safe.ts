import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { COLLECTION_LIVE_QUERY } from "@/app/collection-live-query";
import { normalizeCollectionQueryData } from "@/components/special/collection-detail/normalize-collection-query";
import type { CollectionDetailQueryLikeResult } from "@/components/special/collection-detail/types";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^collections\//i, "")
    .replace(/\s+/g, "-");
}

function isMissingCollectionError(error: unknown, relativePath: string): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes(`Unable to find record content/collections/${relativePath}`);
}

let collectionIndexCache: Array<{ slug: string }> | null = null;

// Tina exposes the content collection as `specialityCollection` in the GraphQL
// schema (the literal name `collection` is reserved by Tina's metadata API).
// We re-key the response to `collection` so the rest of the code (normalizer,
// renderer, etc.) can stay collection-flavored and ignorant of the rename.
function rekeyCollectionResponse(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) return value;
  if (record.collection !== undefined) return record;
  if (record.specialityCollection !== undefined) {
    return { ...record, collection: record.specialityCollection };
  }
  return record;
}

export async function getCollectionDataSafe(slug: string): Promise<CollectionDetailQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    const result = await client.request(
      {
        query: COLLECTION_LIVE_QUERY,
        variables: { relativePath },
      },
      {},
    );

    const record = asRecord(result) || {};

    return {
      data: normalizeCollectionQueryData(rekeyCollectionResponse(record.data), relativePath),
      query: COLLECTION_LIVE_QUERY,
      variables: { relativePath },
    };
  } catch (error) {
    try {
      const frontmatter = await readMarkdownFrontmatter("collections", relativePath);
      return createStaticQueryResult(
        normalizeCollectionQueryData(
          {
            collection: withContentSysFields("collections", relativePath, frontmatter),
          },
          relativePath,
        ),
      );
    } catch {
      if (!isMissingCollectionError(error, relativePath)) {
        console.error(`Unable to load collection "${slug}" from Tina or local file.`, error);
      }

      return createStaticQueryResult({ collection: null });
    }
  }
}

export async function getCollectionIndexSafe(): Promise<Array<{ slug: string }>> {
  if (collectionIndexCache) return collectionIndexCache;

  try {
    const files = await listMarkdownFiles("collections");
    collectionIndexCache = files
      .map((filename) => ({ slug: toSlug(filename) }))
      .sort((left, right) => left.slug.localeCompare(right.slug));

    return collectionIndexCache;
  } catch (error) {
    console.error("Unable to read collection index from local files.", error);
    return [];
  }
}
