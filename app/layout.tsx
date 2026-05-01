import type { Metadata } from "next";
import { Jost, Open_Sans, Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import "yet-another-react-lightbox/styles.css";
import "./globals.css";
import { getGlobalDocumentSafe } from "@/app/get-global-document-safe";
import { getSharedSectionsSafe } from "@/app/get-shared-sections-safe";
import LayoutClient from "@/components/layout/LayoutClient";
import InjectedScripts from "@/components/layout/InjectedScripts";
import { getSiteUrl } from "@/app/lib/site-url";
import {
  FALLBACK_FOOTER_DOCUMENT,
  FALLBACK_GENERAL_DOCUMENT,
  FALLBACK_HEADER_DOCUMENT,
} from "@/components/layout/global-settings";

const redHatDisplay = Red_Hat_Display({ variable: "--font-red-hat-display", subsets: ["latin"] });
const redHatText = Red_Hat_Text({ variable: "--font-red-hat-text", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });

// Site-wide fallback metadata — individual pages override title & description via generateMetadata
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Cabinets Plus Spokane | Kitchen & Bath Renovations",
    template: "%s | Cabinets Plus Spokane",
  },
  description: "Spokane's premier cabinet and stone showroom. Factory-direct semi-custom cabinets, granite & quartz countertops, and flooring.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
  const [headerData, footerData, generalData, sharedSectionsData] = await Promise.all([
    getGlobalDocumentSafe("header.json", FALLBACK_HEADER_DOCUMENT),
    getGlobalDocumentSafe("footer.json", FALLBACK_FOOTER_DOCUMENT),
    getGlobalDocumentSafe("general.json", FALLBACK_GENERAL_DOCUMENT),
    getSharedSectionsSafe(),
  ]);
  const generalRecord = generalData.data.global || FALLBACK_GENERAL_DOCUMENT;
  const headScripts = typeof generalRecord.headScripts === "string" ? generalRecord.headScripts : "";
  const bodyScripts = typeof generalRecord.bodyScripts === "string" ? generalRecord.bodyScripts : "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InjectedScripts placement="head" snippet={headScripts} />
      </head>
      <body className={`${redHatDisplay.variable} ${redHatText.variable} ${jost.variable} ${openSans.variable} antialiased`}>
        <LayoutClient
          footerData={footerData}
          generalData={generalData}
          headerData={headerData}
          sharedSectionsData={sharedSectionsData}
        >
          {children}
        </LayoutClient>
        <InjectedScripts placement="body" snippet={bodyScripts} />
      </body>
    </html>
  );
}
