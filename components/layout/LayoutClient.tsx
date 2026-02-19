"use client";
import { useTina } from "tinacms/dist/react";
import Header from "./Header";
import Footer from "./Footer";
import { GlobalProvider } from "./GlobalContext";

interface LayoutClientProps {
  globalData: { data: any; query: string; variables: any };
  children: React.ReactNode;
}

export default function LayoutClient({ globalData, children }: LayoutClientProps) {
  const { data } = useTina({
    data: globalData.data,
    query: globalData.query,
    variables: globalData.variables,
  });

  return (
    <GlobalProvider value={data.global}>
      <Header data={data.global} raw={data.global} />
      <main className="min-h-screen">{children}</main>
      <Footer data={data.global} raw={data.global} />
    </GlobalProvider>
  );
}
