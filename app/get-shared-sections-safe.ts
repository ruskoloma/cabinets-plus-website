import { createStaticQueryResult, readJsonContentFile } from "@/app/lib/content";
import {
  FALLBACK_SHARED_SECTIONS,
  SHARED_SECTIONS_QUERY,
  type SharedSectionsDocument,
  type SharedSectionsQueryLikeResult,
} from "@/components/shared/shared-sections";
import { client } from "@/tina/__generated__/client";

const SHARED_SECTIONS_RELATIVE_PATH = "shared-sections.json";

export async function getSharedSectionsSafe(): Promise<SharedSectionsQueryLikeResult> {
  try {
    const result = await client.request(
      {
        query: SHARED_SECTIONS_QUERY,
        variables: { relativePath: SHARED_SECTIONS_RELATIVE_PATH },
      },
      {},
    );

    return {
      data: ((result as { data?: { sharedSections?: SharedSectionsDocument | null } }).data || {}),
      query: SHARED_SECTIONS_QUERY,
      variables: { relativePath: SHARED_SECTIONS_RELATIVE_PATH },
    };
  } catch (error) {
    try {
      const sharedSections = await readJsonContentFile<SharedSectionsDocument>(
        "global",
        SHARED_SECTIONS_RELATIVE_PATH,
      );

      return {
        ...createStaticQueryResult({ sharedSections }),
        query: SHARED_SECTIONS_QUERY,
        variables: { relativePath: SHARED_SECTIONS_RELATIVE_PATH },
      };
    } catch {
      console.error("Unable to load shared section settings; using fallback shared sections.", error);
      return {
        ...createStaticQueryResult({ sharedSections: FALLBACK_SHARED_SECTIONS }),
        query: SHARED_SECTIONS_QUERY,
        variables: { relativePath: SHARED_SECTIONS_RELATIVE_PATH },
      };
    }
  }
}
