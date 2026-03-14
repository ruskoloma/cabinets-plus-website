export interface ProductGalleryItemViewModel {
  id: string;
  kind: "image" | "video";
  file: string;
  previewFile: string;
  alt: string;
  tinaField?: string;
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
  imageTinaField?: string;
  titleTinaField?: string;
}

export interface ProductRelatedCardItem {
  href: string;
  name: string;
  code?: string;
  image?: string;
  tinaField?: string;
}
