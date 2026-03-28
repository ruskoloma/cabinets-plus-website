import { createStaticQueryResult, readJsonContentFile } from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";

interface QueryLikeResult<T> {
  data: T;
  query?: string;
  variables?: Record<string, unknown>;
}

export async function getJsonSettingsDocumentSafe<TDocument, TResult extends QueryLikeResult<Record<string, unknown>>>({
  fallback,
  query,
  relativePath,
  resultKey,
}: {
  fallback: TDocument;
  query: string;
  relativePath: string;
  resultKey: string;
}): Promise<TResult> {
  try {
    const result = await client.request(
      {
        query,
        variables: { relativePath },
      },
      {},
    );

    return {
      data: ((result as { data?: Record<string, unknown> }).data || {}) as TResult["data"],
      query,
      variables: { relativePath },
    } as unknown as TResult;
  } catch (error) {
    try {
      const document = await readJsonContentFile<TDocument>("global", relativePath);
      return {
        ...createStaticQueryResult({ [resultKey]: document }),
        query,
        variables: { relativePath },
      } as unknown as TResult;
    } catch {
      console.error(`Unable to load Tina settings for "${relativePath}"; using hardcoded fallback.`, error);
      return {
        ...createStaticQueryResult({ [resultKey]: fallback }),
        query,
        variables: { relativePath },
      } as unknown as TResult;
    }
  }
}
