import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
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

    const record = result && typeof result === "object" ? (result as Record<string, unknown>) : {};

    return {
      data: normalizeCabinetsOverviewQueryData(record.data),
      query: CABINETS_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settingsRaw, cabinetFiles] = await Promise.all([
        fs.readFile(path.join(process.cwd(), "content", "global", "catalog-settings.json"), "utf8"),
        fs.readdir(path.join(process.cwd(), "content", "cabinets")),
      ]);

      const settings = JSON.parse(settingsRaw) as unknown;
      const files = cabinetFiles.filter((file) => file.endsWith(".md"));

      const cabinets = await Promise.all(
        files.map(async (filename) => {
          const fullPath = path.join(process.cwd(), "content", "cabinets", filename);
          const raw = await fs.readFile(fullPath, "utf8");
          const parsed = matter(raw);

          return {
            ...(parsed.data as Record<string, unknown>),
            _sys: {
              filename,
              basename: filename.replace(/\.md$/i, ""),
              relativePath: `cabinets/${filename}`,
            },
          };
        }),
      );

      return {
        data: normalizeCabinetsOverviewQueryData({
          catalogSettings: settings,
          cabinetConnection: {
            edges: cabinets.map((cabinet) => ({ node: cabinet })),
          },
        }),
        query: "",
        variables: {},
      };
    } catch {
      console.error("Unable to load cabinets overview data from Tina or local files.", error);

      return {
        data: normalizeCabinetsOverviewQueryData({}),
        query: "",
        variables: {},
      };
    }
  }
}
