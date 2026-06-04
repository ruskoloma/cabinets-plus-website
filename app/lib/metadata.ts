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

  // A CMS-authored SEO title is the complete, final title — mark it `absolute`
  // so the root layout's "%s | Cabinets Plus Spokane" template can't double the
  // brand (e.g. "… | Cabinets Plus | Cabinets Plus Spokane"). A plain document
  // title is just a name, so it still flows through the template.
  const seoTitle = document.seo?.title?.trim();
  const documentTitle = document.title?.trim();

  return {
    title: seoTitle ? { absolute: seoTitle } : documentTitle || undefined,
    description: document.seo?.description || undefined,
    openGraph: document.seo?.ogImage
      ? { images: [{ url: document.seo.ogImage }] }
      : undefined,
  };
}
