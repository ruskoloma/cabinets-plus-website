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
    children?: Array<{ label?: string | null; href?: string | null } | null> | null;
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
        { label: "Cabinets", href: "/cabinets" },
        { label: "Countertops", href: "/countertops" },
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
          ? item.children.flatMap((child) =>
              child?.label && child?.href ? [{ label: child.label, href: child.href }] : [],
            )
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
