import type { GlobalSettings } from "./GlobalContext";

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
    children?: Array<{
      label?: string | null;
      href?: string | null;
      buttonLabel?: string | null;
      buttonLink?: string | null;
      catalogItems?: Array<{
        name?: string | null;
        code?: string | null;
        image?: string | null;
        link?: string | null;
        imageFrame?: {
          width?: number | null;
          height?: number | null;
        } | null;
      } | null> | null;
    } | null> | null;
  } | null> | null;
  footerLinks?: Array<{ label?: string | null; href?: string | null } | null> | null;
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

type ProductCatalogKey = "cabinets" | "countertops" | "flooring";
type CatalogItemInput = {
  name: string;
  code: string;
  image: string;
  link?: string;
  imageFrame?: {
    width?: number;
    height?: number;
  };
};

const FALLBACK_PRODUCT_CATALOG_ITEMS: Record<ProductCatalogKey, CatalogItemInput[]> = {
  cabinets: [
      { name: "Trenton Fairy", code: "#TGB", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-tgb.png", link: "/cabinets/tgb" },
      { name: "Trenton Swan White", code: "#TWB", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-twb.png", link: "/cabinets/twb" },
      { name: "Designer White", code: "#SWK", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-swk.png", link: "/cabinets/swk" },
      { name: "Artisanal Blue", code: "#ABB", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-abb.png", link: "/cabinets/abb" },
      { name: "Artisanal Ebony", code: "#AEB", image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-aeb.png", link: "/cabinets/aeb" },
  ],
  countertops: [
      {
        name: "Calacatta Dolce",
        code: "#CalacattaDolce",
        image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-countertops-calacatta-dolce.png",
        link: "/countertops/calacattadolce",
        imageFrame: { width: 162, height: 80 },
      },
      {
        name: "Calacatta Simple Grey",
        code: "#CalacattaSimpleGrey",
        image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-countertops-calacatta-simple-grey.png",
        link: "/countertops/calacattasimplegrey",
        imageFrame: { width: 162, height: 80 },
      },
      {
        name: "Calacatta Slim Gold",
        code: "#CalacattaSlimGold",
        image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-countertops-calacatta-slim-gold.png",
        link: "/countertops/calacattaslimgold",
        imageFrame: { width: 157, height: 80 },
      },
      {
        name: "Calacatta Simple Gold",
        code: "#CalacattaSimpleGold",
        image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-countertops-calacatta-simple-gold.png",
        link: "/countertops/calacattasimplegold",
        imageFrame: { width: 157, height: 80 },
      },
      {
        name: "Calacatta Straight Grey",
        code: "#CalacattaStraightGrey",
        image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/nav-catalog-countertops-calacatta-straight-grey.png",
        link: "/countertops/calacattastraightgrey",
        imageFrame: { width: 162, height: 80 },
      },
  ],
  flooring: [],
};

function getNavItemLookupValue(label: string, href?: string | null) {
  return `${label} ${href || ""}`.trim().toLowerCase();
}

function getProductCatalogKey(label: string, href?: string | null): ProductCatalogKey {
  const normalized = getNavItemLookupValue(label, href);
  if (normalized.includes("counter")) return "countertops";
  if (normalized.includes("floor")) return "flooring";
  return "cabinets";
}

function isProductCatalogChild(label: string, href?: string | null) {
  const normalized = getNavItemLookupValue(label, href);
  return normalized.includes("cabinet") || normalized.includes("counter") || normalized.includes("floor");
}

function normalizeCatalogItems(
  items?: Array<{
    name?: string | null;
    code?: string | null;
    image?: string | null;
    link?: string | null;
    imageFrame?: { width?: number | null; height?: number | null } | null;
  } | null> | null,
  fallbackItems?: CatalogItemInput[],
) {
  const normalizedItems = Array.isArray(items)
    ? items.flatMap((item) => {
        if (!item?.name || !item?.code || !item?.image) return [];

        const width = typeof item.imageFrame?.width === "number" ? item.imageFrame.width : undefined;
        const height = typeof item.imageFrame?.height === "number" ? item.imageFrame.height : undefined;

        return [
          {
            name: item.name,
            code: item.code,
            image: item.image,
            link: item.link || undefined,
            imageFrame: width || height ? { width, height } : undefined,
          },
        ];
      })
    : fallbackItems?.map((item) => ({
        name: item.name,
        code: item.code,
        image: item.image,
        link: item.link || undefined,
        imageFrame: item.imageFrame
          ? {
              width: item.imageFrame.width,
              height: item.imageFrame.height,
            }
          : undefined,
      }));

  return normalizedItems?.length ? normalizedItems : undefined;
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
      children: [
        { label: "Cabinets", href: "/cabinets", catalogItems: FALLBACK_PRODUCT_CATALOG_ITEMS.cabinets },
        { label: "Countertops", href: "/countertops", catalogItems: FALLBACK_PRODUCT_CATALOG_ITEMS.countertops },
        { label: "Flooring", href: "/flooring" },
      ],
    },
    {
      label: "Services",
      children: [
        { label: "Kitchen remodeling", href: "/kitchen-remodel" },
        { label: "Bathroom remodeling", href: "/bathroom-remodel" },
      ],
    },
    { label: "Gallery", href: "/gallery" },
    { label: "About us", href: "/about-us" },
    { label: "Contacts", href: "/contact-us" },
  ],
};

export const FALLBACK_FOOTER_DOCUMENT: GlobalDocumentInput = {
  footerLogo: "/library/branding/logo-footer-light.svg",
  footerLinks: [
    { label: "Cabinets", href: "/cabinets" },
    { label: "Countertops", href: "/countertops" },
    { label: "Flooring", href: "/flooring" },
    { label: "Bathroom remodel", href: "/bathroom-remodel" },
    { label: "Kitchen remodel", href: "/kitchen-remodel" },
    { label: "Gallery", href: "/gallery" },
    { label: "About us", href: "/about-us" },
    { label: "Contacts", href: "/contact-us" },
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

              const fallbackCatalogItems = isProductCatalogChild(child.label, child.href)
                ? FALLBACK_PRODUCT_CATALOG_ITEMS[getProductCatalogKey(child.label, child.href)]
                : undefined;

              return [
                {
                  label: child.label,
                  href: child.href,
                  buttonLabel: child.buttonLabel?.trim() || undefined,
                  buttonLink: child.buttonLink?.trim() || undefined,
                  catalogItems: normalizeCatalogItems(child.catalogItems, fallbackCatalogItems),
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

function normalizeFooterLinks(
  global?: GlobalDocumentInput | null,
): GlobalSettings["footerLinks"] {
  return Array.isArray(global?.footerLinks)
    ? global.footerLinks.flatMap((item) =>
        item?.label && item?.href ? [{ label: item.label, href: item.href }] : [],
      )
    : normalizeFooterLinks(FALLBACK_FOOTER_DOCUMENT) || [];
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
    footerLinks: normalizeFooterLinks(footer),
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
