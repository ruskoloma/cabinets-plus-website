import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_POST_PAGE_SETTINGS,
  type PostPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { POST_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getPostPageSettingsSafe(): Promise<PostPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_POST_PAGE_SETTINGS,
    query: POST_PAGE_SETTINGS_QUERY,
    relativePath: "post-page-settings.json",
    resultKey: "postPageSettings",
  });
}
