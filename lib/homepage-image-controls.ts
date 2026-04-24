import {
  IMAGE_SIZE_SELECT_OPTIONS,
  resolveImageSizeSelection,
  type ImageSizeSelection,
} from "./image-size-controls";

export const HOMEPAGE_SECTION_IMAGE_SIZE_OPTIONS = IMAGE_SIZE_SELECT_OPTIONS;

export type HomepageSectionImageOptions = ImageSizeSelection;

export function resolveHomepageSectionImageOptions(value: Record<string, unknown> | null | undefined): HomepageSectionImageOptions {
  return resolveImageSizeSelection(value?.imageSize);
}
