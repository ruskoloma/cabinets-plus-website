import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_GALLERY_PAGE_SETTINGS,
  type GalleryPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { GALLERY_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getGalleryPageSettingsSafe(): Promise<GalleryPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_GALLERY_PAGE_SETTINGS,
    query: GALLERY_PAGE_SETTINGS_QUERY,
    relativePath: "gallery-page-settings.json",
    resultKey: "galleryPageSettings",
  });
}
