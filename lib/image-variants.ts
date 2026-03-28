import presets from "@/lib/image-variant-presets.json";

type VariantPresetConfig = {
  suffix: string;
  width: number;
  quality: number;
};

export const IMAGE_VARIANT_PRESETS = presets as Record<string, VariantPresetConfig>;

export type ImageVariantPreset = keyof typeof presets;

const VARIANT_SUFFIX_PATTERN = new RegExp(
  `\\.(${Object.values(IMAGE_VARIANT_PRESETS)
    .map((preset) => preset.suffix)
    .join("|")})\\.webp$`,
  "i",
);

function splitUrl(source: string): { pathname: string; suffix: string } {
  const match = /^([^?#]+)([?#].*)?$/.exec(source);
  return {
    pathname: match?.[1] ?? source,
    suffix: match?.[2] ?? "",
  };
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
  if (!preset) return src;

  const { pathname, suffix } = splitUrl(src);
  if (!isRasterAsset(pathname) || VARIANT_SUFFIX_PATTERN.test(pathname)) return src;

  return `${pathname.replace(/\.[^.\/]+$/i, `.${IMAGE_VARIANT_PRESETS[preset].suffix}.webp`)}${suffix}`;
}

export function getImageVariantSources(src: string, preset?: ImageVariantPreset) {
  return {
    fallbackSrc: src,
    preferredSrc: getImageVariantUrl(src, preset),
  };
}
