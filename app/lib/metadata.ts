import type { Metadata } from "next";

interface SeoLike {
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
}

interface MetadataDocumentLike {
  title?: string | null;
  seo?: SeoLike | null;
}

export function buildDocumentMetadata(document?: MetadataDocumentLike | null): Metadata {
  if (!document) return {};

  return {
    title: document.seo?.title || document.title || undefined,
    description: document.seo?.description || undefined,
    openGraph: document.seo?.ogImage
      ? { images: [{ url: document.seo.ogImage }] }
      : undefined,
  };
}
