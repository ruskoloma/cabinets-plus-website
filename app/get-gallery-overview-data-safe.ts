import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readJsonContentFile,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
import { client } from "@/tina/__generated__/client";
import { GALLERY_OVERVIEW_QUERY } from "@/components/special/gallery-overview/queries";
import { normalizeGalleryOverviewQueryData } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import type { GalleryOverviewQueryLikeResult } from "@/components/special/gallery-overview/types";

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
      const [settings, projectFiles, collectionFiles] = await Promise.all([
        readJsonContentFile("global", "catalog-settings.json"),
        listMarkdownFiles("projects"),
        listMarkdownFiles("collections").catch(() => [] as string[]),
      ]);

      const [projects, collections] = await Promise.all([
        Promise.all(
          projectFiles.map(async (filename) => {
            const frontmatter = await readMarkdownFrontmatter("projects", filename);
            return withContentSysFields("projects", filename, frontmatter);
          }),
        ),
        Promise.all(
          collectionFiles.map(async (filename) => {
            const frontmatter = await readMarkdownFrontmatter("collections", filename);
            return withContentSysFields("collections", filename, frontmatter);
          }),
        ),
      ]);

      return createStaticQueryResult(
        normalizeGalleryOverviewQueryData({
          catalogSettings: settings,
          projectConnection: {
            edges: projects.map((project) => ({ node: project })),
          },
          collectionConnection: {
            edges: collections.map((collection) => ({ node: collection })),
          },
        }),
      );
    } catch {
      console.error("Unable to load gallery overview data from Tina or local files.", error);

      return createStaticQueryResult(normalizeGalleryOverviewQueryData({}));
    }
  }
}
