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

interface LayoutClientProps {
  globalData: {
    data: { global?: GlobalSettings };
    query?: string;
    variables?: Record<string, unknown>;
  };
  children: React.ReactNode;
}

interface TinaLayoutClientProps {
  globalData: {
    data: { global?: GlobalSettings };
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

function TinaLayoutClient({ globalData, children }: TinaLayoutClientProps) {
  const { data } = useTina({
    data: globalData.data,
    query: globalData.query,
    variables: globalData.variables,
  });

  return <StaticLayout global={(data.global || globalData.data.global) as GlobalSettings}>{children}</StaticLayout>;
}

const FALLBACK_GLOBAL: GlobalSettings = {
  siteName: "Cabinets Plus",
  logo: "/figma/assets/logo-main.svg",
  footerLogo: "/figma/assets/logo-footer-light.svg",
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

export default function LayoutClient({ globalData, children }: LayoutClientProps) {
  const hasLiveQuery = Boolean(globalData.query && globalData.query.trim().length > 0);

  if (!hasLiveQuery) {
    return <StaticLayout global={globalData.data.global || FALLBACK_GLOBAL}>{children}</StaticLayout>;
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
