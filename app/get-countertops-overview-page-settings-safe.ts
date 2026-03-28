import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_COUNTERTOPS_OVERVIEW_PAGE_SETTINGS,
  type CountertopsOverviewPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getCountertopsOverviewPageSettingsSafe(): Promise<CountertopsOverviewPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_COUNTERTOPS_OVERVIEW_PAGE_SETTINGS,
    query: COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY,
    relativePath: "countertops-overview-page-settings.json",
    resultKey: "countertopsOverviewPageSettings",
  });
}
