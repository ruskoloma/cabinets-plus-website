import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_CABINETS_MAIN_PAGE_SETTINGS,
  type CabinetsMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { CABINETS_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getCabinetsMainPageSettingsSafe(): Promise<CabinetsMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_CABINETS_MAIN_PAGE_SETTINGS,
    query: CABINETS_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "cabinets-main-page-settings.json",
    resultKey: "cabinetsMainPageSettings",
  });
}
