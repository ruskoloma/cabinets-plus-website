import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import fs from "node:fs/promises";
import path from "node:path";
import "./globals.css";
import { client } from "@/tina/__generated__/client";
import LayoutClient from "@/components/layout/LayoutClient";

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

const FALLBACK_GLOBAL_SETTINGS = {
  siteName: "Cabinets Plus",
  logo: "/library/branding/logo-main.svg",
  footerLogo: "/library/branding/logo-footer-light.svg",
  phone: "1-509-218-3349",
  address: "4630 E Sprague Ave",
  email: "info@spokanecabinetsplus.com",
  hours: "Mon-Fri: 9:00am - 5:00pm",
  ctaLabel: "Free Design Consultation",
  ctaLink: "/contact-us",
  navSearchLabel: "Search",
  navSearchLink: "/",
  pinterestUrl: "https://www.pinterest.com/",
  navLinks: [],
  footerLinks: [],
  copyrightText: "© 2026 Cabinets Plus Spokane",
};

async function getGlobalDataSafe() {
  try {
    return await client.queries.global({ relativePath: "settings.json" });
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "content", "global", "settings.json");
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        data: { global: parsed },
        query: "",
        variables: {},
      };
    } catch {
      console.error("Unable to load Tina global settings; using hardcoded fallback.", error);
      return {
        data: { global: FALLBACK_GLOBAL_SETTINGS },
        query: "",
        variables: {},
      };
    }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const globalData = await getGlobalDataSafe();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${redHatDisplay.variable} ${redHatText.variable} antialiased`}>
        <LayoutClient globalData={globalData}>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
