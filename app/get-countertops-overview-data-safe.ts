import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
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

    const record = result && typeof result === "object" ? (result as Record<string, unknown>) : {};

    return {
      data: normalizeCountertopsOverviewQueryData(record.data),
      query: COUNTERTOPS_OVERVIEW_QUERY,
      variables: {},
    };
  } catch (error) {
    try {
      const [settingsRaw, countertopFiles] = await Promise.all([
        fs.readFile(path.join(process.cwd(), "content", "global", "catalog-settings.json"), "utf8"),
        fs.readdir(path.join(process.cwd(), "content", "countertops")),
      ]);

      const settings = JSON.parse(settingsRaw) as unknown;
      const files = countertopFiles.filter((file) => file.endsWith(".md"));

      const countertops = await Promise.all(
        files.map(async (filename) => {
          const fullPath = path.join(process.cwd(), "content", "countertops", filename);
          const raw = await fs.readFile(fullPath, "utf8");
          const parsed = matter(raw);

          return {
            ...(parsed.data as Record<string, unknown>),
            _sys: {
              filename,
              basename: filename.replace(/\.md$/i, ""),
              relativePath: `countertops/${filename}`,
            },
          };
        }),
      );

      return {
        data: normalizeCountertopsOverviewQueryData({
          catalogSettings: settings,
          countertopConnection: {
            edges: countertops.map((countertop) => ({ node: countertop })),
          },
        }),
        query: "",
        variables: {},
      };
    } catch {
      console.error("Unable to load countertops overview data from Tina or local files.", error);

      return {
        data: normalizeCountertopsOverviewQueryData({}),
        query: "",
        variables: {},
      };
    }
  }
}
