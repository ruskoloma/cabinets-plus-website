/**
 * Asset helpers for the /resources page.
 *
 * Magazines and brochures are rasterized once into WebP page images (see
 * scripts/upload-resource-assets.mjs) and served alongside the untouched
 * original file. The CMS only stores a folder key like
 * `magazines/inspiration-guide` plus a page count, so a 85-spread magazine
 * costs one CMS entry instead of 85 URL fields.
 *
 * The files live in the S3 bucket under `library/resources/`, which is the
 * same bucket the TinaCMS media manager browses (it is mounted at the bucket
 * root), so editors can see, replace and delete them from the CMS. Nothing is
 * committed to the repo. NEXT_PUBLIC_RESOURCE_ASSET_BASE overrides the prefix.
 *
 * The host is spelled out the same way `next.config.ts` spells it in
 * `images.remotePatterns` — these are client components, so a server-only
 * S3_CDN_URL would not reach the browser.
 */

const DEFAULT_ASSET_BASE = "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/resources";

export const RESOURCE_ASSET_BASE = (
  process.env.NEXT_PUBLIC_RESOURCE_ASSET_BASE || DEFAULT_ASSET_BASE
).replace(/\/+$/, "");

function isAbsolute(value: string): boolean {
  return /^(https?:)?\/\//i.test(value) || value.startsWith("data:");
}

/** Resolve a folder-relative asset path against the configured asset base. */
export function resourceAssetUrl(assetPath: string): string {
  const value = assetPath.trim();
  if (!value) return "";
  if (isAbsolute(value)) return value;
  return `${RESOURCE_ASSET_BASE}/${value.replace(/^\/+/, "")}`;
}

/**
 * Cover thumbnail for a resource folder. An editor-picked cover comes from the
 * Tina media manager already fully qualified, so it is used verbatim.
 */
export function resourceCoverUrl(assetBase: string, override?: string): string {
  const trimmedOverride = (override || "").trim();
  if (trimmedOverride) return trimmedOverride;
  if (!assetBase.trim()) return "";
  return resourceAssetUrl(`${assetBase.replace(/\/+$/, "")}/cover.webp`);
}

function buildPageUrls(assetBase: string, count: number, prefix: string, padding: number): string[] {
  const base = assetBase.trim().replace(/\/+$/, "");
  if (!base || !Number.isFinite(count) || count < 1) return [];

  return Array.from({ length: Math.floor(count) }, (_, index) =>
    resourceAssetUrl(`${base}/${prefix}-${String(index + 1).padStart(padding, "0")}.webp`),
  );
}

/** Magazine spread images: `<assetBase>/spread-001.webp` … */
export function magazineSpreadUrls(assetBase: string, spreadCount: number): string[] {
  return buildPageUrls(assetBase, spreadCount, "spread", 3);
}

/**
 * Document page images: editor-uploaded images when present, otherwise the
 * generated `<assetBase>/page-01.webp` … sequence.
 */
export function documentPageUrls(
  assetBase: string,
  pageCount: number,
  uploadedPages?: ReadonlyArray<string>,
): string[] {
  const uploaded = (uploadedPages || []).map((page) => (page || "").trim()).filter(Boolean);
  if (uploaded.length) return uploaded;
  return buildPageUrls(assetBase, pageCount, "page", 2);
}

/**
 * Original file to download.
 *
 * `directUrl` is what the Tina media manager hands back when an editor uploads
 * a PDF or image themselves; it wins over the `magazines/<slug>/<slug>.pdf`
 * folder convention so a one-page brochure can be added without running the
 * rasterizer.
 */
export function resourceDownloadUrl(assetBase: string, downloadFile: string, directUrl?: string): string {
  const direct = (directUrl || "").trim();
  if (direct) return direct;

  const file = (downloadFile || "").trim();
  if (!file) return "";
  if (isAbsolute(file) || file.startsWith("/")) return file;
  const base = assetBase.trim().replace(/\/+$/, "");
  return resourceAssetUrl(base ? `${base}/${file}` : file);
}

/** "PDF", "JPG" … derived from the download filename when not set in the CMS. */
export function resourceFileType(downloadFile: string, override?: string): string {
  const trimmedOverride = (override || "").trim();
  if (trimmedOverride) return trimmedOverride.toUpperCase();
  const extension = (downloadFile || "").split(".").pop() || "";
  if (!extension || extension === downloadFile) return "";
  return extension.toUpperCase() === "JPEG" ? "JPG" : extension.toUpperCase();
}

/** Join the small meta bits under a card into one "PDF · 2 pages · 4.9 MB" line. */
export function joinResourceMeta(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((part) => (typeof part === "number" ? String(part) : (part || "").trim()))
    .filter(Boolean)
    .join(" · ");
}
