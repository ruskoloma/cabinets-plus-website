export interface ProductGalleryItemViewModel {
  id: string;
  kind: "image" | "video";
  file: string;
  previewFile: string;
  alt: string;
  mimeType?: string;
  tinaField?: string;
  focusMediaItemId?: string;
}

export interface ProductTechnicalDetailViewModel {
  key?: string | null;
  value?: string | null;
  unit?: string | null;
  keyTinaField?: string;
  valueTinaField?: string;
}

export interface ProductProjectCardItem {
  file: string;
  title: string;
  href?: string;
  selectionTinaField?: string;
  imageTinaField?: string;
  titleTinaField?: string;
  focusItemId?: string;
}

export interface ProductRelatedCardItem {
  href: string;
  name: string;
  code?: string;
  image?: string;
  tinaField?: string;
  focusItemId?: string;
}
