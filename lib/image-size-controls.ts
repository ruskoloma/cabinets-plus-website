import { IMAGE_VARIANT_PRESETS, type ImageVariantPreset } from "./image-variants";

export type ImageSizeChoice = "auto" | "original" | ImageVariantPreset;

export interface ImageSizeSelection {
  useOriginal: boolean;
  variant?: ImageVariantPreset;
}

export const IMAGE_SIZE_SELECT_OPTIONS = [
  { label: "Auto", value: "auto" },
  { label: "Original Source", value: "original" },
  ...(Object.entries(IMAGE_VARIANT_PRESETS) as Array<[ImageVariantPreset, { width: number }]>).map(([key, preset]) => ({
    label: `${key.charAt(0).toUpperCase()}${key.slice(1)} (${preset.width}px)`,
    value: key,
  })),
] as const;

export function isImageVariantPreset(value: unknown): value is ImageVariantPreset {
  return typeof value === "string" && value in IMAGE_VARIANT_PRESETS;
}

export function normalizeImageSizeChoice(value: unknown, fallback: ImageSizeChoice): ImageSizeChoice {
  if (value === "auto" || value === "original") return value;
  if (isImageVariantPreset(value)) return value;
  return fallback;
}

export function resolveImageSizeSelection(value: unknown): ImageSizeSelection {
  if (value === "original") {
    return { useOriginal: true };
  }

  if (isImageVariantPreset(value)) {
    return { useOriginal: false, variant: value };
  }

  return { useOriginal: false };
}

export function resolveConfiguredImageVariant(
  value: unknown,
  defaultVariant: ImageVariantPreset,
): ImageVariantPreset | undefined {
  const selection = resolveImageSizeSelection(value);
  if (selection.useOriginal) return undefined;
  return selection.variant ?? defaultVariant;
}

export function resolveConfiguredImageVariantProp(
  value: unknown,
  defaultVariant: ImageVariantPreset,
): ImageVariantPreset | null {
  const selection = resolveImageSizeSelection(value);
  if (selection.useOriginal) return null;
  return selection.variant ?? defaultVariant;
}
