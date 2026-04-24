import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_COUNTERTOPS_MAIN_PAGE_SETTINGS,
  type CountertopsMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { COUNTERTOPS_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getCountertopsMainPageSettingsSafe(): Promise<CountertopsMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_COUNTERTOPS_MAIN_PAGE_SETTINGS,
    query: COUNTERTOPS_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "countertops-main-page-settings.json",
    resultKey: "countertopsMainPageSettings",
  });
}
