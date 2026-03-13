"use client";
import { useTina } from "tinacms/dist/react";
import Header from "./Header";
import Footer from "./Footer";
import { GlobalProvider } from "./GlobalContext";

interface GlobalSettings {
  siteName: string;
  phone: string;
  address: string;
  email: string;
  hours?: string;
  ctaLabel: string;
  ctaLink: string;
  navSearchLabel?: string;
  navSearchLink?: string;
  pinterestUrl?: string;
  navLinks?: Array<{
    label: string;
    href?: string;
    children?: Array<{ label: string; href: string }>;
  }>;
  footerLinks?: Array<{ label: string; href: string }>;
  logo?: string;
  footerLogo?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  copyrightText?: string;
}

interface GlobalSettingsInput {
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

interface LayoutClientProps {
  globalData: {
    data: { global?: GlobalSettingsInput | null };
    query?: string;
    variables?: Record<string, unknown>;
  };
  children: React.ReactNode;
}

interface TinaLayoutClientProps {
  globalData: {
    data: { global?: GlobalSettingsInput | null };
    query: string;
    variables: Record<string, unknown>;
  };
  children: React.ReactNode;
}

function StaticLayout({ global, children }: { global: GlobalSettings; children: React.ReactNode }) {
  const tinaRaw = global as unknown as Record<string, unknown>;

  return (
    <GlobalProvider value={global}>
      <Header data={global} raw={tinaRaw} />
      <main className="min-h-screen">{children}</main>
      <Footer data={global} raw={tinaRaw} />
    </GlobalProvider>
  );
}

const FALLBACK_GLOBAL: GlobalSettings = {
  siteName: "Cabinets Plus",
  logo: "/library/branding/logo-main.svg",
  footerLogo: "/library/branding/logo-footer-light.svg",
  phone: "1-509-218-3349",
  address: "4630 E Sprague Ave",
  email: "info@spokanecabinetsplus.com",
  ctaLabel: "Free Design Consultation",
  ctaLink: "/contact-us",
  navSearchLabel: "Search",
  navSearchLink: "/",
  pinterestUrl: "https://www.pinterest.com/",
  navLinks: [],
  footerLinks: [],
};

function normalizeGlobalSettings(global?: GlobalSettingsInput | null): GlobalSettings {
  const navLinks = Array.isArray(global?.navLinks)
    ? global.navLinks.flatMap((item) => {
        if (!item?.label) return [];
        const children = Array.isArray(item.children)
          ? item.children.flatMap((child) => (child?.label && child?.href ? [{ label: child.label, href: child.href }] : []))
          : undefined;

        return [{
          label: item.label,
          href: item.href ?? undefined,
          children: children && children.length > 0 ? children : undefined,
        }];
      })
    : FALLBACK_GLOBAL.navLinks;

  const footerLinks = Array.isArray(global?.footerLinks)
    ? global.footerLinks.flatMap((item) => (item?.label && item?.href ? [{ label: item.label, href: item.href }] : []))
    : FALLBACK_GLOBAL.footerLinks;

  return {
    siteName: global?.siteName ?? FALLBACK_GLOBAL.siteName,
    phone: global?.phone ?? FALLBACK_GLOBAL.phone,
    address: global?.address ?? FALLBACK_GLOBAL.address,
    email: global?.email ?? FALLBACK_GLOBAL.email,
    hours: global?.hours ?? FALLBACK_GLOBAL.hours,
    ctaLabel: global?.ctaLabel ?? FALLBACK_GLOBAL.ctaLabel,
    ctaLink: global?.ctaLink ?? FALLBACK_GLOBAL.ctaLink,
    navSearchLabel: global?.navSearchLabel ?? FALLBACK_GLOBAL.navSearchLabel,
    navSearchLink: global?.navSearchLink ?? FALLBACK_GLOBAL.navSearchLink,
    pinterestUrl: global?.pinterestUrl ?? FALLBACK_GLOBAL.pinterestUrl,
    navLinks,
    footerLinks,
    logo: global?.logo ?? FALLBACK_GLOBAL.logo,
    footerLogo: global?.footerLogo ?? FALLBACK_GLOBAL.footerLogo,
    instagramUrl: global?.instagramUrl ?? FALLBACK_GLOBAL.instagramUrl,
    facebookUrl: global?.facebookUrl ?? FALLBACK_GLOBAL.facebookUrl,
    copyrightText: global?.copyrightText ?? FALLBACK_GLOBAL.copyrightText,
  };
}

function TinaLayoutClient({ globalData, children }: TinaLayoutClientProps) {
  const { data } = useTina({
    data: globalData.data,
    query: globalData.query,
    variables: globalData.variables,
  });

  return <StaticLayout global={normalizeGlobalSettings(data.global || globalData.data.global)}>{children}</StaticLayout>;
}

export default function LayoutClient({ globalData, children }: LayoutClientProps) {
  const hasLiveQuery = Boolean(globalData.query && globalData.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <StaticLayout global={normalizeGlobalSettings(globalData.data.global)}>{children}</StaticLayout>;
  }

  return (
    <TinaLayoutClient
      globalData={{
        data: globalData.data,
        query: globalData.query || "",
        variables: globalData.variables || {},
      }}
    >
      {children}
    </TinaLayoutClient>
  );
}
