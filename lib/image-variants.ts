import presets from "@/lib/image-variant-presets.json";

type VariantPresetConfig = {
  suffix: string;
  width: number;
  quality: number;
};

export const IMAGE_VARIANT_PRESETS = presets as Record<string, VariantPresetConfig>;

export type ImageVariantPreset = keyof typeof presets;

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["cabinetsplus4630.s3.us-west-2.amazonaws.com"]);

const VARIANT_SUFFIX_PATTERN = new RegExp(
  `\\.(${Object.values(IMAGE_VARIANT_PRESETS)
    .map((preset) => preset.suffix)
    .join("|")})\\.webp$`,
  "i",
);

function parseRemoteImageUrl(src: string): URL | null {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function splitUrl(source: string): { pathname: string; suffix: string } {
  const match = /^([^?#]+)([?#].*)?$/.exec(source);
  return {
    pathname: match?.[1] ?? source,
    suffix: match?.[2] ?? "",
  };
}

export function normalizeImageSrc(src: unknown): string | null {
  if (typeof src !== "string") return null;

  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (/[\u0000-\u001f\u007f\s]/.test(trimmed)) return null;

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return null;
    if (trimmed.startsWith("/_next/image")) return null;
    return trimmed;
  }

  const remoteUrl = parseRemoteImageUrl(trimmed);
  return remoteUrl ? remoteUrl.toString() : null;
}

export function isVectorAsset(src: string): boolean {
  const { pathname } = splitUrl(src);
  return src.startsWith("data:image/svg+xml") || /\.svg$/i.test(pathname);
}

export function isRasterAsset(src: string): boolean {
  const { pathname } = splitUrl(src);
  return /\.(avif|heic|heif|jpe?g|png|webp)$/i.test(pathname);
}

export function getImageVariantUrl(src: string, preset?: ImageVariantPreset): string {
  const normalizedSrc = normalizeImageSrc(src);
  if (!normalizedSrc) return "";
  if (!preset) return normalizedSrc;

  const remoteUrl = parseRemoteImageUrl(normalizedSrc);
  if (!remoteUrl) return normalizedSrc;

  const { pathname, suffix } = splitUrl(normalizedSrc);
  if (!isRasterAsset(pathname) || VARIANT_SUFFIX_PATTERN.test(pathname)) return normalizedSrc;

  return `${pathname.replace(/\.[^.\/]+$/i, `.${IMAGE_VARIANT_PRESETS[preset].suffix}.webp`)}${suffix}`;
}

export function getImageVariantSources(src: string, preset?: ImageVariantPreset) {
  const normalizedSrc = normalizeImageSrc(src) || "";

  return {
    fallbackSrc: normalizedSrc,
    preferredSrc: getImageVariantUrl(normalizedSrc, preset),
  };
}
