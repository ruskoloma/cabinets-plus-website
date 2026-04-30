import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_GLASS_ENCLOSURES_MAIN_PAGE_SETTINGS,
  type GlassEnclosuresMainPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { GLASS_ENCLOSURES_MAIN_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getGlassEnclosuresMainPageSettingsSafe(): Promise<GlassEnclosuresMainPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_GLASS_ENCLOSURES_MAIN_PAGE_SETTINGS,
    query: GLASS_ENCLOSURES_MAIN_PAGE_SETTINGS_QUERY,
    relativePath: "glass-enclosures-main-page-settings.json",
    resultKey: "glassEnclosuresMainPageSettings",
  });
}
