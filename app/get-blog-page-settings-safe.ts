import { getJsonSettingsDocumentSafe } from "@/app/get-json-settings-document-safe";
import {
  FALLBACK_BLOG_PAGE_SETTINGS,
  type BlogPageSettingsQueryLikeResult,
} from "@/components/page-settings/types";
import { BLOG_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";

export function getBlogPageSettingsSafe(): Promise<BlogPageSettingsQueryLikeResult> {
  return getJsonSettingsDocumentSafe({
    fallback: FALLBACK_BLOG_PAGE_SETTINGS,
    query: BLOG_PAGE_SETTINGS_QUERY,
    relativePath: "blog-page-settings.json",
    resultKey: "blogPageSettings",
  });
}
