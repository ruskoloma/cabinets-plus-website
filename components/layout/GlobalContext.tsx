"use client";
import { createContext, useContext } from "react";

interface GlobalSettings {
  siteName: string;
  phone: string;
  address: string;
  email: string;
  hours?: string;
  ctaLabel: string;
  ctaLink: string;
}

const GlobalContext = createContext<GlobalSettings | null>(null);

export const GlobalProvider = GlobalContext.Provider;

export function useGlobal(): GlobalSettings {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobal must be used inside GlobalProvider");
  return ctx;
}
