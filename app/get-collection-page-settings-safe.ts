import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_COLLECTION_PAGE_SETTINGS,
  type CollectionPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { COLLECTION_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getCollectionPageSettingsSafe(): Promise<CollectionPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_COLLECTION_PAGE_SETTINGS,
    query: COLLECTION_PAGE_SETTINGS_QUERY,
    relativePath: "collection-page-settings.json",
    resultKey: "collectionPageSettings",
  });
}
