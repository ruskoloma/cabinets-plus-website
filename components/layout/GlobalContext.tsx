"use client";
import { createContext, useContext } from "react";

interface GlobalSettings {
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
    children?: Array<{ label: string; href: string }>;
  }>;
  footerLinks?: Array<{ label: string; href: string }>;
}

const GlobalContext = createContext<GlobalSettings | null>(null);

export const GlobalProvider = GlobalContext.Provider;

export function useGlobal(): GlobalSettings {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobal must be used inside GlobalProvider");
  return ctx;
}
