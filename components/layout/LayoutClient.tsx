"use client";

import { useTina } from "tinacms/dist/react";
import Header from "./Header";
import Footer from "./Footer";
import { GlobalProvider, type GlobalSettings } from "./GlobalContext";

interface GlobalDocumentInput {
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

interface GlobalDocumentQueryResult {
  data: { global?: GlobalDocumentInput | null };
  query?: string;
  variables?: Record<string, unknown>;
}

interface LayoutClientProps {
  headerData: GlobalDocumentQueryResult;
  footerData: GlobalDocumentQueryResult;
  generalData: GlobalDocumentQueryResult;
  children: React.ReactNode;
}

interface TinaLayoutClientProps {
  headerData: {
    data: { global?: GlobalDocumentInput | null };
    query: string;
    variables: Record<string, unknown>;
  };
  footerData: {
    data: { global?: GlobalDocumentInput | null };
    query: string;
    variables: Record<string, unknown>;
  };
  generalData: {
    data: { global?: GlobalDocumentInput | null };
    query: string;
    variables: Record<string, unknown>;
  };
  children: React.ReactNode;
}

const FALLBACK_HEADER: GlobalDocumentInput = {
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

const FALLBACK_FOOTER: GlobalDocumentInput = {
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

const FALLBACK_GENERAL: GlobalDocumentInput = {
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
          ? item.children.flatMap((child) => (child?.label && child?.href ? [{ label: child.label, href: child.href }] : []))
          : undefined;

        return [
          {
            label: item.label,
            href: item.href ?? undefined,
            children: children && children.length > 0 ? children : undefined,
          },
        ];
      })
    : (normalizeNavLinks(FALLBACK_HEADER) || []);
}

function normalizeFooterLinks(global?: GlobalDocumentInput | null): GlobalSettings["footerLinks"] {
  return Array.isArray(global?.footerLinks)
    ? global.footerLinks.flatMap((item) => (item?.label && item?.href ? [{ label: item.label, href: item.href }] : []))
    : (normalizeFooterLinks(FALLBACK_FOOTER) || []);
}

function toRawDocument(value?: GlobalDocumentInput | null): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeGlobalSettings(
  header?: GlobalDocumentInput | null,
  footer?: GlobalDocumentInput | null,
  general?: GlobalDocumentInput | null
): GlobalSettings {
  return {
    siteName: header?.siteName ?? FALLBACK_HEADER.siteName ?? "Cabinets Plus",
    phone: general?.phone ?? footer?.phone ?? header?.phone ?? FALLBACK_GENERAL.phone ?? "",
    address: general?.address ?? footer?.address ?? header?.address ?? FALLBACK_GENERAL.address ?? "",
    email: general?.email ?? footer?.email ?? FALLBACK_GENERAL.email ?? "",
    hours: general?.hours ?? footer?.hours ?? FALLBACK_GENERAL.hours ?? undefined,
    ctaLabel: header?.ctaLabel ?? FALLBACK_HEADER.ctaLabel ?? "Free Design Consultation",
    ctaLink: header?.ctaLink ?? FALLBACK_HEADER.ctaLink ?? "/contact-us",
    navSearchLabel: header?.navSearchLabel ?? FALLBACK_HEADER.navSearchLabel ?? undefined,
    navSearchLink: header?.navSearchLink ?? FALLBACK_HEADER.navSearchLink ?? undefined,
    pinterestUrl: general?.pinterestUrl ?? footer?.pinterestUrl ?? FALLBACK_GENERAL.pinterestUrl ?? undefined,
    navLinks: normalizeNavLinks(header),
    footerLinks: normalizeFooterLinks(footer),
    logo: header?.logo ?? FALLBACK_HEADER.logo ?? undefined,
    footerLogo: footer?.footerLogo ?? FALLBACK_FOOTER.footerLogo ?? undefined,
    instagramUrl: general?.instagramUrl ?? footer?.instagramUrl ?? FALLBACK_GENERAL.instagramUrl ?? undefined,
    facebookUrl: general?.facebookUrl ?? footer?.facebookUrl ?? FALLBACK_GENERAL.facebookUrl ?? undefined,
    copyrightText: footer?.copyrightText ?? FALLBACK_FOOTER.copyrightText ?? undefined,
  };
}

function StaticLayout({
  children,
  footerRaw,
  generalRaw,
  global,
  headerRaw,
}: {
  children: React.ReactNode;
  footerRaw: Record<string, unknown>;
  generalRaw: Record<string, unknown>;
  global: GlobalSettings;
  headerRaw: Record<string, unknown>;
}) {
  return (
    <GlobalProvider
      value={{
        rawDocuments: {
          footer: footerRaw,
          general: generalRaw,
          header: headerRaw,
        },
        settings: global,
      }}
    >
      <Header data={global} generalRaw={generalRaw} headerRaw={headerRaw} />
      <main className="min-h-screen">{children}</main>
      <Footer data={global} footerRaw={footerRaw} generalRaw={generalRaw} />
    </GlobalProvider>
  );
}

function TinaLayoutClient({ headerData, footerData, generalData, children }: TinaLayoutClientProps) {
  const liveHeader = useTina({
    data: headerData.data,
    query: headerData.query,
    variables: headerData.variables,
  });
  const liveFooter = useTina({
    data: footerData.data,
    query: footerData.query,
    variables: footerData.variables,
  });
  const liveGeneral = useTina({
    data: generalData.data,
    query: generalData.query,
    variables: generalData.variables,
  });

  const header = liveHeader.data.global || headerData.data.global;
  const footer = liveFooter.data.global || footerData.data.global;
  const general = liveGeneral.data.global || generalData.data.global;

  return (
    <StaticLayout
      footerRaw={toRawDocument(footer)}
      generalRaw={toRawDocument(general)}
      global={normalizeGlobalSettings(header, footer, general)}
      headerRaw={toRawDocument(header)}
    >
      {children}
    </StaticLayout>
  );
}

export default function LayoutClient({ headerData, footerData, generalData, children }: LayoutClientProps) {
  const hasHeaderLiveQuery = Boolean(headerData.query && headerData.query.trim().length > 0);
  const hasFooterLiveQuery = Boolean(footerData.query && footerData.query.trim().length > 0);
  const hasGeneralLiveQuery = Boolean(generalData.query && generalData.query.trim().length > 0);

  if (!hasHeaderLiveQuery || !hasFooterLiveQuery || !hasGeneralLiveQuery) {
    return (
      <StaticLayout
        footerRaw={toRawDocument(footerData.data.global)}
        generalRaw={toRawDocument(generalData.data.global)}
        global={normalizeGlobalSettings(headerData.data.global, footerData.data.global, generalData.data.global)}
        headerRaw={toRawDocument(headerData.data.global)}
      >
        {children}
      </StaticLayout>
    );
  }

  return (
    <TinaLayoutClient
      footerData={{
        data: footerData.data,
        query: footerData.query || "",
        variables: footerData.variables || {},
      }}
      generalData={{
        data: generalData.data,
        query: generalData.query || "",
        variables: generalData.variables || {},
      }}
      headerData={{
        data: headerData.data,
        query: headerData.query || "",
        variables: headerData.variables || {},
      }}
    >
      {children}
    </TinaLayoutClient>
  );
}
