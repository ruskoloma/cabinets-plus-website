import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { client } from "@/tina/__generated__/client";
import LayoutClient from "@/components/layout/LayoutClient";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
  const globalData = await client.queries.global({ relativePath: "settings.json" });

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutClient globalData={globalData}>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
