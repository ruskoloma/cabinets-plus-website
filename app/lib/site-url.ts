// Canonical production origin is https + www. This is the single source of
// truth for metadataBase, sitemap <loc> entries, robots.txt host/sitemap, and
// per-page rel=canonical — they must all agree with the platform redirect that
// funnels every request to https://www.spokanecabinetsplus.com.
export const DEFAULT_SITE_URL = "https://www.spokanecabinetsplus.com";

const CANONICAL_APEX_HOST = "spokanecabinetsplus.com";

function normalizeSiteUrl(value: string): string | null {
  const rawValue = value.trim();
  if (!rawValue) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`);
    if (url.hostname.endsWith(".vercel.app")) return null;

    // Force the bare apex to its www canonical so an apex-valued env var
    // (e.g. VERCEL_PROJECT_PRODUCTION_URL) can never split signals onto non-www.
    if (url.hostname === CANONICAL_APEX_HOST) {
      url.protocol = "https:";
      url.hostname = `www.${CANONICAL_APEX_HOST}`;
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    DEFAULT_SITE_URL,
  ];

  for (const candidate of candidates) {
    const siteUrl = normalizeSiteUrl(candidate || "");
    if (siteUrl) return siteUrl;
  }

  return DEFAULT_SITE_URL;
}
