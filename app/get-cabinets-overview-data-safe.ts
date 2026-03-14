import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readJsonContentFile,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { normalizeCabinetsOverviewQueryData } from "@/components/cabinets-overview/normalize-cabinets-overview-query";
import { CABINETS_OVERVIEW_QUERY } from "@/components/cabinets-overview/queries";
import type { CabinetsOverviewQueryLikeResult } from "@/components/cabinets-overview/types";

export async function getCabinetsOverviewDataSafe(): Promise<CabinetsOverviewQueryLikeResult> {
  try {
    const result = await client.request({
      query: CABINETS_OVERVIEW_QUERY,
      variables: {},
    }, {});

    const record = asRecord(result) || {};

    return {
      data: normalizeCabinetsOverviewQueryData(record.data),
      query: CABINETS_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settings, files] = await Promise.all([
        readJsonContentFile("global", "catalog-settings.json"),
        listMarkdownFiles("cabinets"),
      ]);

      const cabinets = await Promise.all(
        files.map(async (filename) => {
          const frontmatter = await readMarkdownFrontmatter("cabinets", filename);
          return withContentSysFields("cabinets", filename, frontmatter);
        }),
      );

      return createStaticQueryResult(
        normalizeCabinetsOverviewQueryData({
          catalogSettings: settings,
          cabinetConnection: {
            edges: cabinets.map((cabinet) => ({ node: cabinet })),
          },
        }),
      );
    } catch {
      console.error("Unable to load cabinets overview data from Tina or local files.", error);

      return createStaticQueryResult(normalizeCabinetsOverviewQueryData({}));
    }
  }
}
