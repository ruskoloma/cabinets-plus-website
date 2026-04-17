import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readJsonContentFile,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { normalizeFlooringOverviewQueryData } from "@/components/flooring-overview/normalize-flooring-overview-query";
import { FLOORING_OVERVIEW_QUERY } from "@/components/flooring-overview/queries";
import type { FlooringOverviewQueryLikeResult } from "@/components/flooring-overview/types";

export async function getFlooringOverviewDataSafe(): Promise<FlooringOverviewQueryLikeResult> {
  try {
    const result = await client.request({
      query: FLOORING_OVERVIEW_QUERY,
      variables: {},
    }, {});

    const record = asRecord(result) || {};

    return {
      data: normalizeFlooringOverviewQueryData(record.data),
      query: FLOORING_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settings, files] = await Promise.all([
        readJsonContentFile("global", "catalog-settings.json"),
        listMarkdownFiles("flooring"),
      ]);

      const flooring = await Promise.all(
        files.map(async (filename) => {
          const frontmatter = await readMarkdownFrontmatter("flooring", filename);
          return withContentSysFields("flooring", filename, frontmatter);
        }),
      );

      return createStaticQueryResult(
        normalizeFlooringOverviewQueryData({
          catalogSettings: settings,
          flooringConnection: {
            edges: flooring.map((flooring) => ({ node: flooring })),
          },
        }),
      );
    } catch {
      console.error("Unable to load flooring overview data from Tina or local files.", error);

      return createStaticQueryResult(normalizeFlooringOverviewQueryData({}));
    }
  }
}
