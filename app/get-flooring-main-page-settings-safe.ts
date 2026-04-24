import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_FLOORING_MAIN_PAGE_SETTINGS,
  type FlooringMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { FLOORING_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getFlooringMainPageSettingsSafe(): Promise<FlooringMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_FLOORING_MAIN_PAGE_SETTINGS,
    query: FLOORING_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "flooring-main-page-settings.json",
    resultKey: "flooringMainPageSettings",
  });
}
