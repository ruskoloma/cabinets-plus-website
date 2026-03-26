"use client";
import { createContext, useContext } from "react";

export interface GlobalSettings {
  siteName: string;
  logo?: string;
  footerLogo?: string;
  phone: string;
  address: string;
  email: string;
  hours?: string;
  ctaLabel: string;
  ctaLink: string;
  navSearchLabel?: string;
  navSearchLink?: string;
  pinterestUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  copyrightText?: string;
  navLinks?: Array<{
    label: string;
    href?: string;
    children?: Array<{
      label: string;
      href: string;
      catalogItems?: Array<{
        name: string;
        code: string;
        image: string;
        imageFrame?: {
          width?: number;
          height?: number;
        };
      }>;
    }>;
  }>;
  footerLinks?: Array<{ label: string; href: string }>;
}

interface GlobalRawDocuments {
  footer: Record<string, unknown>;
  general: Record<string, unknown>;
  header: Record<string, unknown>;
}

interface GlobalContextValue {
  rawDocuments: GlobalRawDocuments;
  settings: GlobalSettings;
}

const GlobalContext = createContext<GlobalContextValue | null>(null);

export const GlobalProvider = GlobalContext.Provider;

export function useGlobal(): GlobalSettings {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobal must be used inside GlobalProvider");
  return ctx.settings;
}

export function useGlobalRawDocument(documentName: keyof GlobalRawDocuments): Record<string, unknown> {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobalRawDocument must be used inside GlobalProvider");
  return ctx.rawDocuments[documentName];
}
