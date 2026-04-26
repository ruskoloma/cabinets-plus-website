import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_BATHROOM_REMODEL_MAIN_PAGE_SETTINGS,
  type BathroomRemodelMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { BATHROOM_REMODEL_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getBathroomRemodelMainPageSettingsSafe(): Promise<BathroomRemodelMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_BATHROOM_REMODEL_MAIN_PAGE_SETTINGS,
    query: BATHROOM_REMODEL_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "bathroom-remodel-main-page-settings.json",
    resultKey: "bathroomRemodelMainPageSettings",
  });
}
