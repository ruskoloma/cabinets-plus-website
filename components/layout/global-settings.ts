import type { GlobalSettings } from "./GlobalContext";
import { normalizeImageSrc } from "@/lib/image-variants";

interface ProductReferenceInput {
  __typename?: string | null;
  name?: string | null;
  title?: string | null;
  code?: string | null;
  picture?: string | null;
  coverImage?: string | null;
  slug?: string | null;
  _sys?: { filename?: string | null; breadcrumbs?: Array<string | null> | null } | null;
}

interface CatalogItemReferenceInput {
  __typename?: string | null;
  collection?: ProductReferenceInput | Record<string, unknown> | string | null;
  product?: ProductReferenceInput | Record<string, unknown> | string | null;
}

interface NavLinkChildInput {
  __typename?: string | null;
  label?: string | null;
  href?: string | null;
  buttonLabel?: string | null;
  buttonLink?: string | null;
  catalogItems?: Array<CatalogItemReferenceInput | null> | null;
}

export interface GlobalDocumentInput {
  siteName?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  hours?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  navSearchLabel?: string | null;
  navSearchLink?: string | null;
  pinterestUrl?: string | null;
  headScripts?: string | null;
  bodyScripts?: string | null;
  navLinks?: Array<{
    label?: string | null;
    href?: string | null;
    children?: Array<NavLinkChildInput | null> | null;
  } | null> | null;
  footerLinks1?: Array<{ label?: string | null; href?: string | null } | null> | null;
  footerLinks2?: Array<{ label?: string | null; href?: string | null } | null> | null;
  footerLinks3?: Array<{ label?: string | null; href?: string | null } | null> | null;
  logo?: string | null;
  footerLogo?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  copyrightText?: string | null;
}

export interface GlobalDocumentQueryResult {
  data: { global?: GlobalDocumentInput | null };
  query?: string;
  variables?: Record<string, unknown>;
}

type NavLinkChildKind = "cabinetCatalog" | "countertopCatalog" | "flooringCatalog" | "glassCatalog" | "simpleLink";
type CatalogItemInput = {
  name: string;
  code: string;
  image: string;
  link?: string;
};

const NAV_CHILD_TEMPLATE_MAP: Record<string, NavLinkChildKind> = {
  GlobalNavLinksChildrenCabinetCatalog: "cabinetCatalog",
  GlobalNavLinksChildrenCountertopCatalog: "countertopCatalog",
  GlobalNavLinksChildrenFlooringCatalog: "flooringCatalog",
  GlobalNavLinksChildrenGlassCatalog: "glassCatalog",
  GlobalNavLinksChildrenSimpleLink: "simpleLink",
};

const CATALOG_PRODUCT_PREFIX_BY_TYPENAME: Record<string, string> = {
  Cabinet: "/cabinets",
  Countertop: "/countertops",
  Flooring: "/flooring/catalog",
  SpecialityCollection: "/collections",
};

function resolveProductSlug(product: ProductReferenceInput | null | undefined): string | null {
  if (!product) return null;
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  if (slug) return slug;
  const filename = typeof product._sys?.filename === "string" ? product._sys.filename.trim() : "";
  return filename || null;
}

function formatCatalogCode(code?: string | null): string {
  if (!code) return "";
  const stripped = String(code).replace(/^#+/, "");
  return stripped ? `#${stripped}` : "";
}

function resolveCatalogItem(
  item: CatalogItemReferenceInput | null | undefined,
): CatalogItemInput | null {
  if (!item) return null;

  const rawReference = item.product || item.collection;
  const rawProduct = rawReference && typeof rawReference === "object"
    ? (rawReference as ProductReferenceInput)
    : null;

  if (!rawProduct) return null;

  const typename = typeof rawProduct.__typename === "string" ? rawProduct.__typename : "";
  const prefix = CATALOG_PRODUCT_PREFIX_BY_TYPENAME[typename];
  if (!prefix) return null;

  const slug = resolveProductSlug(rawProduct);
  if (!slug) return null;

  const name =
    typeof rawProduct.name === "string" && rawProduct.name.trim()
      ? rawProduct.name.trim()
      : typeof rawProduct.title === "string"
        ? rawProduct.title.trim()
        : "";
  const image = normalizeImageSrc(rawProduct.picture || rawProduct.coverImage);
  if (!name || !image) return null;

  return {
    name,
    code: formatCatalogCode(rawProduct.code),
    image,
    link: `${prefix}/${slug}`,
  };
}

function resolveNavChildKind(child: NavLinkChildInput | null | undefined): NavLinkChildKind | null {
  if (!child || typeof child !== "object") return null;
  const typename = typeof child.__typename === "string" ? child.__typename : "";
  if (typename && NAV_CHILD_TEMPLATE_MAP[typename]) return NAV_CHILD_TEMPLATE_MAP[typename];
  const template =
    typeof (child as Record<string, unknown>)._template === "string"
      ? ((child as Record<string, unknown>)._template as string)
      : "";
  if (
    template === "cabinetCatalog" ||
    template === "countertopCatalog" ||
    template === "flooringCatalog" ||
    template === "glassCatalog" ||
    template === "simpleLink"
  ) {
    return template;
  }
  return null;
}

export const FALLBACK_HEADER_DOCUMENT: GlobalDocumentInput = {
  siteName: "Cabinets Plus",
  logo: "/library/branding/logo-main.svg",
  ctaLabel: "Free Design Consultation",
  ctaLink: "/contact-us",
  navSearchLabel: "Search",
  navSearchLink: "/",
  navLinks: [
    {
      label: "Products",
      children: [],
    },
    {
      label: "Services",
      children: [],
    },
    { label: "Gallery", href: "/gallery" },
    { label: "About us", href: "/about-us" },
    { label: "Contacts", href: "/contact-us" },
  ],
};

export const FALLBACK_FOOTER_DOCUMENT: GlobalDocumentInput = {
  footerLogo: "/library/branding/logo-footer-light.svg",
  footerLinks1: [
    { label: "Cabinets", href: "/cabinets" },
    { label: "Countertops", href: "/countertops" },
    { label: "Flooring", href: "/flooring" },
    { label: "Bathroom remodel", href: "/bathroom-remodel" },
    { label: "Kitchen remodel", href: "/kitchen-remodel" },
  ],
  footerLinks2: [
    { label: "Gallery", href: "/gallery" },
    { label: "About us", href: "/about-us" },
    { label: "Contacts", href: "/contact-us" },
  ],
  footerLinks3: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ's", href: "/#faq" },
    { label: "Magazine", href: "/blog" },
  ],
  copyrightText: "© 2026 Cabinets Plus Spokane",
};

export const FALLBACK_GENERAL_DOCUMENT: GlobalDocumentInput = {
  phone: "1-509-218-3349",
  address: "4630 E Sprague Ave",
  email: "info@spokanecabinetsplus.com",
  hours: "Mon-Fri: 9:00am - 5:00pm",
  pinterestUrl: "https://www.pinterest.com/",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  headScripts: "",
  bodyScripts: "",
};

function normalizeNavLinks(global?: GlobalDocumentInput | null): GlobalSettings["navLinks"] {
  return Array.isArray(global?.navLinks)
    ? global.navLinks.flatMap((item) => {
        if (!item?.label) return [];
        const children = Array.isArray(item.children)
          ? item.children.flatMap((child) => {
              if (!child?.label || !child?.href) return [];

              const kind = resolveNavChildKind(child);
              if (!kind) return [];

              const catalogItems = Array.isArray(child.catalogItems)
                ? child.catalogItems.flatMap((rawItem) => {
                    const resolved = resolveCatalogItem(rawItem);
                    return resolved ? [resolved] : [];
                  })
                : undefined;

              return [
                {
                  label: child.label,
                  href: child.href,
                  kind,
                  buttonLabel: child.buttonLabel?.trim() || undefined,
                  buttonLink: child.buttonLink?.trim() || undefined,
                  catalogItems: catalogItems?.length ? catalogItems : undefined,
                },
              ];
            })
          : undefined;

        return [
          {
            label: item.label,
            href: item.href ?? undefined,
            children: children?.length ? children : undefined,
          },
        ];
      })
    : normalizeNavLinks(FALLBACK_HEADER_DOCUMENT) || [];
}

function normalizeFooterLinkList(
  list: GlobalDocumentInput["footerLinks1"] | undefined | null,
  fallback: GlobalDocumentInput["footerLinks1"] | undefined | null,
): Array<{ label: string; href: string }> {
  const source = Array.isArray(list) ? list : fallback;
  return Array.isArray(source)
    ? source.flatMap((item) =>
        item?.label && item?.href ? [{ label: item.label, href: item.href }] : [],
      )
    : [];
}

export function toRawDocument(value?: GlobalDocumentInput | null): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function normalizeGlobalSettings(
  header?: GlobalDocumentInput | null,
  footer?: GlobalDocumentInput | null,
  general?: GlobalDocumentInput | null,
): GlobalSettings {
  return {
    siteName: header?.siteName ?? FALLBACK_HEADER_DOCUMENT.siteName ?? "Cabinets Plus",
    phone:
      general?.phone ??
      footer?.phone ??
      header?.phone ??
      FALLBACK_GENERAL_DOCUMENT.phone ??
      "",
    address:
      general?.address ??
      footer?.address ??
      header?.address ??
      FALLBACK_GENERAL_DOCUMENT.address ??
      "",
    email: general?.email ?? footer?.email ?? FALLBACK_GENERAL_DOCUMENT.email ?? "",
    hours: general?.hours ?? footer?.hours ?? FALLBACK_GENERAL_DOCUMENT.hours ?? undefined,
    ctaLabel:
      header?.ctaLabel ??
      FALLBACK_HEADER_DOCUMENT.ctaLabel ??
      "Free Design Consultation",
    ctaLink: header?.ctaLink ?? FALLBACK_HEADER_DOCUMENT.ctaLink ?? "/contact-us",
    navSearchLabel:
      header?.navSearchLabel ?? FALLBACK_HEADER_DOCUMENT.navSearchLabel ?? undefined,
    navSearchLink:
      header?.navSearchLink ?? FALLBACK_HEADER_DOCUMENT.navSearchLink ?? undefined,
    pinterestUrl:
      general?.pinterestUrl ??
      footer?.pinterestUrl ??
      FALLBACK_GENERAL_DOCUMENT.pinterestUrl ??
      undefined,
    navLinks: normalizeNavLinks(header),
    footerLinks1: normalizeFooterLinkList(footer?.footerLinks1, FALLBACK_FOOTER_DOCUMENT.footerLinks1),
    footerLinks2: normalizeFooterLinkList(footer?.footerLinks2, FALLBACK_FOOTER_DOCUMENT.footerLinks2),
    footerLinks3: normalizeFooterLinkList(footer?.footerLinks3, FALLBACK_FOOTER_DOCUMENT.footerLinks3),
    logo: header?.logo ?? FALLBACK_HEADER_DOCUMENT.logo ?? undefined,
    footerLogo: footer?.footerLogo ?? FALLBACK_FOOTER_DOCUMENT.footerLogo ?? undefined,
    instagramUrl:
      general?.instagramUrl ??
      footer?.instagramUrl ??
      FALLBACK_GENERAL_DOCUMENT.instagramUrl ??
      undefined,
    facebookUrl:
      general?.facebookUrl ??
      footer?.facebookUrl ??
      FALLBACK_GENERAL_DOCUMENT.facebookUrl ??
      undefined,
    copyrightText:
      footer?.copyrightText ?? FALLBACK_FOOTER_DOCUMENT.copyrightText ?? undefined,
  };
}
