import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
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

    const record = result && typeof result === "object" ? (result as Record<string, unknown>) : {};

    return {
      data: normalizeGalleryOverviewQueryData(record.data),
      query: GALLERY_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settingsRaw, projectFiles] = await Promise.all([
        fs.readFile(path.join(process.cwd(), "content", "global", "catalog-settings.json"), "utf8"),
        fs.readdir(path.join(process.cwd(), "content", "projects")),
      ]);

      const settings = JSON.parse(settingsRaw) as unknown;
      const files = projectFiles.filter((file) => file.endsWith(".md"));

      const projects = await Promise.all(
        files.map(async (filename) => {
          const fullPath = path.join(process.cwd(), "content", "projects", filename);
          const raw = await fs.readFile(fullPath, "utf8");
          const parsed = matter(raw);

          return {
            ...(parsed.data as Record<string, unknown>),
            _sys: {
              filename,
              basename: filename.replace(/\.md$/i, ""),
              relativePath: `projects/${filename}`,
            },
          };
        }),
      );

      return {
        data: normalizeGalleryOverviewQueryData({
          catalogSettings: settings,
          projectConnection: {
            edges: projects.map((project) => ({ node: project })),
          },
        }),
        query: "",
        variables: {},
      };
    } catch {
      console.error("Unable to load gallery overview data from Tina or local files.", error);

      return {
        data: normalizeGalleryOverviewQueryData({}),
        query: "",
        variables: {},
      };
    }
  }
}
