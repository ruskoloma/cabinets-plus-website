import { createStaticQueryResult, readJsonContentFile } from "@/app/lib/content";
import type {
  CountertopPageSettings,
  CountertopPageSettingsQueryLikeResult,
} from "@/components/countertop/types";
import { COUNTERTOP_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import { client } from "@/tina/__generated__/client";

export async function getCountertopPageSettingsSafe(): Promise<CountertopPageSettingsQueryLikeResult> {
  try {
    const result = await client.request(
      {
        query: COUNTERTOP_PAGE_SETTINGS_QUERY,
        variables: { relativePath: "countertop-page-settings.json" },
      },
      {},
    );

    return {
      data: (result as { data?: { countertopPageSettings?: CountertopPageSettings | null } }).data || {},
      query: COUNTERTOP_PAGE_SETTINGS_QUERY,
      variables: { relativePath: "countertop-page-settings.json" },
    };
  } catch {
    try {
      const countertopPageSettings = await readJsonContentFile<CountertopPageSettings>(
        "global",
        "countertop-page-settings.json",
      );

      return {
        ...createStaticQueryResult({ countertopPageSettings }),
        query: COUNTERTOP_PAGE_SETTINGS_QUERY,
        variables: { relativePath: "countertop-page-settings.json" },
      };
    } catch {
      return createStaticQueryResult({ countertopPageSettings: null });
    }
  }
}
