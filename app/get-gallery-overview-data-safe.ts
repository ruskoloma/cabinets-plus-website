import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readJsonContentFile,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { GALLERY_OVERVIEW_QUERY } from "@/components/gallery-overview/queries";
import { normalizeGalleryOverviewQueryData } from "@/components/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewQueryLikeResult } from "@/components/gallery-overview/types";

export async function getGalleryOverviewDataSafe(): Promise<GalleryOverviewQueryLikeResult> {
  try {
    const result = await client.request(
      {
        query: GALLERY_OVERVIEW_QUERY,
        variables: {},
      },
      {},
    );

    const record = asRecord(result) || {};

    return {
      data: normalizeGalleryOverviewQueryData(record.data),
      query: GALLERY_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settings, files] = await Promise.all([
        readJsonContentFile("global", "catalog-settings.json"),
        listMarkdownFiles("projects"),
      ]);

      const projects = await Promise.all(
        files.map(async (filename) => {
          const frontmatter = await readMarkdownFrontmatter("projects", filename);
          return withContentSysFields("projects", filename, frontmatter);
        }),
      );

      return createStaticQueryResult(
        normalizeGalleryOverviewQueryData({
          catalogSettings: settings,
          projectConnection: {
            edges: projects.map((project) => ({ node: project })),
          },
        }),
      );
    } catch {
      console.error("Unable to load gallery overview data from Tina or local files.", error);

      return createStaticQueryResult(normalizeGalleryOverviewQueryData({}));
    }
  }
}
