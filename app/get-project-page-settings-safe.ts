import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_PROJECT_PAGE_SETTINGS,
  type ProjectPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { PROJECT_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getProjectPageSettingsSafe(): Promise<ProjectPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_PROJECT_PAGE_SETTINGS,
    query: PROJECT_PAGE_SETTINGS_QUERY,
    relativePath: "project-page-settings.json",
    resultKey: "projectPageSettings",
  });
}
