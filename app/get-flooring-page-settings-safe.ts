import { createStaticQueryResult, readJsonContentFile } from "@/app/lib/content";
import type {
  FlooringPageSettings,
  FlooringPageSettingsQueryLikeResult,
} from "@/components/flooring/types";
import { FLOORING_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import { client } from "@/tina/__generated__/client";

export async function getFlooringPageSettingsSafe(): Promise<FlooringPageSettingsQueryLikeResult> {
  try {
    const result = await client.request(
      {
        query: FLOORING_PAGE_SETTINGS_QUERY,
        variables: { relativePath: "flooring-page-settings.json" },
      },
      {},
    );

    return {
      data: (result as { data?: { flooringPageSettings?: FlooringPageSettings | null } }).data || {},
      query: FLOORING_PAGE_SETTINGS_QUERY,
      variables: { relativePath: "flooring-page-settings.json" },
    };
  } catch {
    try {
      const flooringPageSettings = await readJsonContentFile<FlooringPageSettings>(
        "global",
        "flooring-page-settings.json",
      );

      return {
        ...createStaticQueryResult({ flooringPageSettings }),
        query: FLOORING_PAGE_SETTINGS_QUERY,
        variables: { relativePath: "flooring-page-settings.json" },
      };
    } catch {
      return createStaticQueryResult({ flooringPageSettings: null });
    }
  }
}
