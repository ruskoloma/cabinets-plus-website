"use client";

import { useTina } from "tinacms/dist/react";
import Header from "./Header";
import Footer from "./Footer";
import RouteScrollReset from "./RouteScrollReset";
import { GlobalProvider, type GlobalSettings } from "./GlobalContext";
import {
  normalizeGlobalSettings,
  toRawDocument,
  type GlobalDocumentQueryResult,
} from "./global-settings";

interface LayoutClientProps {
  headerData: GlobalDocumentQueryResult;
  footerData: GlobalDocumentQueryResult;
  generalData: GlobalDocumentQueryResult;
  children: React.ReactNode;
}

type LiveGlobalDocumentQueryResult = GlobalDocumentQueryResult & {
  query: string;
  variables: Record<string, unknown>;
};

interface TinaLayoutClientProps {
  headerData: LiveGlobalDocumentQueryResult;
  footerData: LiveGlobalDocumentQueryResult;
  generalData: LiveGlobalDocumentQueryResult;
  children: React.ReactNode;
}

function StaticLayout({
  children,
  footerRaw,
  generalRaw,
  global,
  headerRaw,
}: {
  children: React.ReactNode;
  footerRaw: Record<string, unknown>;
  generalRaw: Record<string, unknown>;
  global: GlobalSettings;
  headerRaw: Record<string, unknown>;
}) {
  return (
    <GlobalProvider
      value={{
        rawDocuments: {
          footer: footerRaw,
          general: generalRaw,
          header: headerRaw,
        },
        settings: global,
      }}
    >
      <RouteScrollReset />
      <Header data={global} generalRaw={generalRaw} headerRaw={headerRaw} />
      <main className="min-h-screen">{children}</main>
      <Footer data={global} footerRaw={footerRaw} generalRaw={generalRaw} />
    </GlobalProvider>
  );
}

function hasLiveQuery(result: GlobalDocumentQueryResult): boolean {
  return Boolean(result.query && result.query.trim().length > 0);
}

function toLiveDocumentResult(
  result: GlobalDocumentQueryResult,
): LiveGlobalDocumentQueryResult {
  return {
    data: result.data,
    query: result.query || "",
    variables: result.variables || {},
  };
}

function TinaLayoutClient({ headerData, footerData, generalData, children }: TinaLayoutClientProps) {
  const liveHeader = useTina({
    data: headerData.data,
    query: headerData.query,
    variables: headerData.variables,
  });
  const liveFooter = useTina({
    data: footerData.data,
    query: footerData.query,
    variables: footerData.variables,
  });
  const liveGeneral = useTina({
    data: generalData.data,
    query: generalData.query,
    variables: generalData.variables,
  });

  const header = liveHeader.data.global || headerData.data.global;
  const footer = liveFooter.data.global || footerData.data.global;
  const general = liveGeneral.data.global || generalData.data.global;

  return (
    <StaticLayout
      footerRaw={toRawDocument(footer)}
      generalRaw={toRawDocument(general)}
      global={normalizeGlobalSettings(header, footer, general)}
      headerRaw={toRawDocument(header)}
    >
      {children}
    </StaticLayout>
  );
}

export default function LayoutClient({ headerData, footerData, generalData, children }: LayoutClientProps) {
  if (
    !hasLiveQuery(headerData)
    || !hasLiveQuery(footerData)
    || !hasLiveQuery(generalData)
  ) {
    return (
      <StaticLayout
        footerRaw={toRawDocument(footerData.data.global)}
        generalRaw={toRawDocument(generalData.data.global)}
        global={normalizeGlobalSettings(headerData.data.global, footerData.data.global, generalData.data.global)}
        headerRaw={toRawDocument(headerData.data.global)}
      >
        {children}
      </StaticLayout>
    );
  }

  return (
    <TinaLayoutClient
      footerData={toLiveDocumentResult(footerData)}
      generalData={toLiveDocumentResult(generalData)}
      headerData={toLiveDocumentResult(headerData)}
    >
      {children}
    </TinaLayoutClient>
  );
}
