import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import "./globals.css";
import { getGlobalDocumentSafe } from "@/app/get-global-document-safe";
import LayoutClient from "@/components/layout/LayoutClient";
import InjectedScripts from "@/components/layout/InjectedScripts";
import {
  FALLBACK_FOOTER_DOCUMENT,
  FALLBACK_GENERAL_DOCUMENT,
  FALLBACK_HEADER_DOCUMENT,
} from "@/components/layout/global-settings";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headerData, footerData, generalData] = await Promise.all([
    getGlobalDocumentSafe("header.json", FALLBACK_HEADER_DOCUMENT),
    getGlobalDocumentSafe("footer.json", FALLBACK_FOOTER_DOCUMENT),
    getGlobalDocumentSafe("general.json", FALLBACK_GENERAL_DOCUMENT),
  ]);
  const generalRecord = generalData.data.global || FALLBACK_GENERAL_DOCUMENT;
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
