import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_KITCHEN_REMODEL_MAIN_PAGE_SETTINGS,
  type KitchenRemodelMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { KITCHEN_REMODEL_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getKitchenRemodelMainPageSettingsSafe(): Promise<KitchenRemodelMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_KITCHEN_REMODEL_MAIN_PAGE_SETTINGS,
    query: KITCHEN_REMODEL_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "kitchen-remodel-main-page-settings.json",
    resultKey: "kitchenRemodelMainPageSettings",
  });
}
