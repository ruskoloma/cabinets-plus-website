import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_CABINET_REFINISHING_MAIN_PAGE_SETTINGS,
  type CabinetRefinishingMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { CABINET_REFINISHING_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getCabinetRefinishingMainPageSettingsSafe(): Promise<CabinetRefinishingMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_CABINET_REFINISHING_MAIN_PAGE_SETTINGS,
    query: CABINET_REFINISHING_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "cabinet-refinishing-main-page-settings.json",
    resultKey: "cabinetRefinishingMainPageSettings",
  });
}
