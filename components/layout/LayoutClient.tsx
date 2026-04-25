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
import type { SharedSectionsQueryLikeResult } from "@/components/shared/shared-sections";
import type { SharedSectionsDocument } from "@/components/shared/shared-sections";

interface LayoutClientProps {
  headerData: GlobalDocumentQueryResult;
  footerData: GlobalDocumentQueryResult;
  generalData: GlobalDocumentQueryResult;
  sharedSectionsData: SharedSectionsQueryLikeResult;
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
  sharedSectionsData: SharedSectionsQueryLikeResult & {
    query: string;
    variables: Record<string, unknown>;
  };
  children: React.ReactNode;
}

function StaticLayout({
  children,
  footerRaw,
  generalRaw,
  global,
  headerRaw,
  sharedSectionsRaw,
}: {
  children: React.ReactNode;
  footerRaw: Record<string, unknown>;
  generalRaw: Record<string, unknown>;
  global: GlobalSettings;
  headerRaw: Record<string, unknown>;
  sharedSectionsRaw: Record<string, unknown>;
}) {
  return (
    <GlobalProvider
      value={{
        rawDocuments: {
          footer: footerRaw,
          general: generalRaw,
          header: headerRaw,
        },
        sharedSections: sharedSectionsRaw as SharedSectionsDocument,
        settings: global,
      }}
    >
      <RouteScrollReset />
      <Header data={global} generalRaw={generalRaw} headerRaw={headerRaw} />
      <main className="min-h-screen bg-white">{children}</main>
      <Footer data={global} footerRaw={footerRaw} generalRaw={generalRaw} />
    </GlobalProvider>
  );
}

function hasLiveQuery(result: { query?: string | null }): boolean {
  return Boolean(result.query && result.query.trim().length > 0);
}

function toRawRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

function TinaLayoutClient({ headerData, footerData, generalData, sharedSectionsData, children }: TinaLayoutClientProps) {
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
  const liveSharedSections = useTina({
    data: sharedSectionsData.data,
    query: sharedSectionsData.query,
    variables: sharedSectionsData.variables,
  });

  const header = liveHeader.data.global || headerData.data.global;
  const footer = liveFooter.data.global || footerData.data.global;
  const general = liveGeneral.data.global || generalData.data.global;
  const sharedSections = liveSharedSections.data.sharedSections || sharedSectionsData.data.sharedSections || {};

  return (
    <StaticLayout
      footerRaw={toRawDocument(footer)}
      generalRaw={toRawDocument(general)}
      global={normalizeGlobalSettings(header, footer, general)}
      headerRaw={toRawDocument(header)}
      sharedSectionsRaw={toRawRecord(sharedSections)}
    >
      {children}
    </StaticLayout>
  );
}

function toLiveSharedSectionsResult(
  result: SharedSectionsQueryLikeResult,
): SharedSectionsQueryLikeResult & { query: string; variables: Record<string, unknown> } {
  return {
    data: result.data,
    query: result.query || "",
    variables: result.variables || {},
  };
}

export default function LayoutClient({ headerData, footerData, generalData, sharedSectionsData, children }: LayoutClientProps) {
  if (
    !hasLiveQuery(headerData)
    || !hasLiveQuery(footerData)
    || !hasLiveQuery(generalData)
    || !hasLiveQuery(sharedSectionsData)
  ) {
    return (
      <StaticLayout
        footerRaw={toRawDocument(footerData.data.global)}
        generalRaw={toRawDocument(generalData.data.global)}
        global={normalizeGlobalSettings(headerData.data.global, footerData.data.global, generalData.data.global)}
        headerRaw={toRawDocument(headerData.data.global)}
        sharedSectionsRaw={toRawRecord(sharedSectionsData.data.sharedSections)}
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
      sharedSectionsData={toLiveSharedSectionsResult(sharedSectionsData)}
    >
      {children}
    </TinaLayoutClient>
  );
}
