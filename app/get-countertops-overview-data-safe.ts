import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readJsonContentFile,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { normalizeCountertopsOverviewQueryData } from "@/components/countertops-overview/normalize-countertops-overview-query";
import { COUNTERTOPS_OVERVIEW_QUERY } from "@/components/countertops-overview/queries";
import type { CountertopsOverviewQueryLikeResult } from "@/components/countertops-overview/types";

export async function getCountertopsOverviewDataSafe(): Promise<CountertopsOverviewQueryLikeResult> {
  try {
    const result = await client.request({
      query: COUNTERTOPS_OVERVIEW_QUERY,
      variables: {},
    }, {});

    const record = asRecord(result) || {};

    return {
      data: normalizeCountertopsOverviewQueryData(record.data),
      query: COUNTERTOPS_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settings, files] = await Promise.all([
        readJsonContentFile("global", "catalog-settings.json"),
        listMarkdownFiles("countertops"),
      ]);

      const countertops = await Promise.all(
        files.map(async (filename) => {
          const frontmatter = await readMarkdownFrontmatter("countertops", filename);
          return withContentSysFields("countertops", filename, frontmatter);
        }),
      );

      return createStaticQueryResult(
        normalizeCountertopsOverviewQueryData({
          catalogSettings: settings,
          countertopConnection: {
            edges: countertops.map((countertop) => ({ node: countertop })),
          },
        }),
      );
    } catch {
      console.error("Unable to load countertops overview data from Tina or local files.", error);

      return createStaticQueryResult(normalizeCountertopsOverviewQueryData({}));
    }
  }
}
