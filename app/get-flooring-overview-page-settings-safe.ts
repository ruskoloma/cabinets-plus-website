import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_FLOORING_OVERVIEW_PAGE_SETTINGS,
  type FlooringOverviewPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getFlooringOverviewPageSettingsSafe(): Promise<FlooringOverviewPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_FLOORING_OVERVIEW_PAGE_SETTINGS,
    query: FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY,
    relativePath: "flooring-overview-page-settings.json",
    resultKey: "flooringOverviewPageSettings",
  });
}
