import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import fs from "node:fs/promises";
import path from "node:path";
import "./globals.css";
import { client } from "@/tina/__generated__/client";
import LayoutClient from "@/components/layout/LayoutClient";
import InjectedScripts from "@/components/layout/InjectedScripts";

const redHatDisplay = Red_Hat_Display({ variable: "--font-red-hat-display", subsets: ["latin"] });
const redHatText = Red_Hat_Text({ variable: "--font-red-hat-text", subsets: ["latin"] });

// Site-wide fallback metadata — individual pages override title & description via generateMetadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Cabinets Plus Spokane | Kitchen & Bath Renovations",
    template: "%s | Cabinets Plus Spokane",
  },
  description: "Spokane's premier cabinet and stone showroom. Factory-direct semi-custom cabinets, granite & quartz countertops, and flooring.",
  openGraph: {
    siteName: "Cabinets Plus Spokane",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_HEADER_SETTINGS = {
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

const FALLBACK_FOOTER_SETTINGS = {
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

const FALLBACK_GENERAL_SETTINGS = {
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

async function getGlobalDocumentSafe(relativePath: string, fallback: Record<string, unknown>) {
  try {
    return await client.queries.global({ relativePath });
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "content", "global", relativePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        data: { global: parsed },
        query: "",
        variables: {},
      };
    } catch {
      console.error(`Unable to load Tina global settings for "${relativePath}"; using hardcoded fallback.`, error);
      return {
        data: { global: fallback },
        query: "",
        variables: {},
      };
    }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headerData, footerData, generalData] = await Promise.all([
    getGlobalDocumentSafe("header.json", FALLBACK_HEADER_SETTINGS),
    getGlobalDocumentSafe("footer.json", FALLBACK_FOOTER_SETTINGS),
    getGlobalDocumentSafe("general.json", FALLBACK_GENERAL_SETTINGS),
  ]);
  const generalRecord = generalData.data.global || FALLBACK_GENERAL_SETTINGS;
  const headScripts = typeof generalRecord.headScripts === "string" ? generalRecord.headScripts : "";
  const bodyScripts = typeof generalRecord.bodyScripts === "string" ? generalRecord.bodyScripts : "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InjectedScripts placement="head" snippet={headScripts} />
      </head>
      <body className={`${redHatDisplay.variable} ${redHatText.variable} antialiased`}>
        <LayoutClient footerData={footerData} generalData={generalData} headerData={headerData}>
          {children}
        </LayoutClient>
        <InjectedScripts placement="body" snippet={bodyScripts} />
      </body>
    </html>
  );
}
