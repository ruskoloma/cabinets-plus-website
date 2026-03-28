import { createStaticQueryResult, readJsonContentFile } from "@/app/lib/content";
import type {
  CabinetPageSettings,
  CabinetPageSettingsQueryLikeResult,
} from "@/components/cabinet-door/types";
import { CABINET_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import { client } from "@/tina/__generated__/client";

export async function getCabinetPageSettingsSafe(): Promise<CabinetPageSettingsQueryLikeResult> {
  try {
    const result = await client.request(
      {
        query: CABINET_PAGE_SETTINGS_QUERY,
        variables: { relativePath: "cabinet-page-settings.json" },
      },
      {},
    );

    return {
      data: (result as { data?: { cabinetPageSettings?: CabinetPageSettings | null } }).data || {},
      query: CABINET_PAGE_SETTINGS_QUERY,
      variables: { relativePath: "cabinet-page-settings.json" },
    };
  } catch {
    try {
      const cabinetPageSettings = await readJsonContentFile<CabinetPageSettings>(
        "global",
        "cabinet-page-settings.json",
      );

      return {
        ...createStaticQueryResult({ cabinetPageSettings }),
        query: CABINET_PAGE_SETTINGS_QUERY,
        variables: { relativePath: "cabinet-page-settings.json" },
      };
    } catch {
      return createStaticQueryResult({ cabinetPageSettings: null });
    }
  }
}
