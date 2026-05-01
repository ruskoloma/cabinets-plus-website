export const DEFAULT_SITE_URL = "https://spokanecabinetsplus.com";

function normalizeSiteUrl(value: string): string | null {
  const rawValue = value.trim();
  if (!rawValue) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`);
    if (url.hostname.endsWith(".vercel.app")) return null;

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
