import {
  createStaticQueryResult,
  readJsonContentFile,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import type {
  GlobalDocumentInput,
  GlobalDocumentQueryResult,
} from "@/components/layout/global-settings";
import { client } from "@/tina/__generated__/client";
import { GlobalDocument } from "@/tina/__generated__/types";

const REFERENCE_PATH_PATTERN = /^content\/([^/]+)\/([^/]+\.md)$/;

const TYPENAME_BY_COLLECTION: Record<string, string> = {
  cabinets: "Cabinet",
  countertops: "Countertop",
  flooring: "Flooring",
  collections: "SpecialityCollection",
};

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

async function resolveReferenceDocument(
  reference: unknown,
): Promise<Record<string, unknown> | string | null | undefined> {
  if (reference == null) return reference;
  if (typeof reference !== "string") {
    return typeof reference === "object" ? (reference as Record<string, unknown>) : undefined;
  }

  const match = reference.match(REFERENCE_PATH_PATTERN);
  if (!match) return reference;

  const [, collection, filename] = match;
  const typename = TYPENAME_BY_COLLECTION[collection];
  if (!typename) return reference;

  try {
    const data = await readMarkdownFrontmatter(collection, filename);
    const sys = withContentSysFields(collection, filename, {});

    return {
      __typename: typename,
      _sys: sys._sys,
      code: stringField(data, "code"),
      coverImage: stringField(data, "coverImage"),
      name: stringField(data, "name"),
      picture: stringField(data, "picture"),
      slug: stringField(data, "slug"),
      title: stringField(data, "title"),
    };
  } catch {
    return reference;
  }
}

async function hydrateHeaderCatalogReferences(global: GlobalDocumentInput): Promise<GlobalDocumentInput> {
  for (const navItem of global.navLinks || []) {
    for (const child of navItem?.children || []) {
      for (const item of child?.catalogItems || []) {
        if (!item) continue;
        item.collection = await resolveReferenceDocument(item.collection);
        item.product = await resolveReferenceDocument(item.product);
      }
    }
  }

  return global;
}

export async function getGlobalDocumentSafe(
  relativePath: string,
  fallback: GlobalDocumentInput,
): Promise<GlobalDocumentQueryResult> {
  try {
    return await client.queries.global({ relativePath });
  } catch (error) {
    try {
      const rawGlobal = await readJsonContentFile<GlobalDocumentInput>("global", relativePath);
      const global = relativePath === "header.json"
        ? await hydrateHeaderCatalogReferences(rawGlobal)
        : rawGlobal;

      return {
        ...createStaticQueryResult({ global }),
        query: GlobalDocument,
        variables: { relativePath },
      };
    } catch {
      console.error(
        `Unable to load Tina global settings for "${relativePath}"; using hardcoded fallback.`,
        error,
      );
      return {
        ...createStaticQueryResult({ global: fallback }),
        query: GlobalDocument,
        variables: { relativePath },
      };
    }
  }
}
