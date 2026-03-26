import { createStaticQueryResult, readJsonContentFile } from "@/app/lib/content";
import type {
  GlobalDocumentInput,
  GlobalDocumentQueryResult,
} from "@/components/layout/global-settings";
import { client } from "@/tina/__generated__/client";
import { GlobalDocument } from "@/tina/__generated__/types";

export async function getGlobalDocumentSafe(
  relativePath: string,
  fallback: GlobalDocumentInput,
): Promise<GlobalDocumentQueryResult> {
  try {
    return await client.queries.global({ relativePath });
  } catch (error) {
    try {
      const global = await readJsonContentFile<GlobalDocumentInput>("global", relativePath);
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
