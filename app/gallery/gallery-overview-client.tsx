"use client";

import { useEditState } from "tinacms/dist/react";
import { useTina } from "tinacms/dist/react";
import GalleryOverviewPage from "@/components/special/gallery-overview/GalleryOverviewPage";
import { normalizeGalleryOverviewQueryData } from "@/components/special/gallery-overview/normalize-gallery-overview-query";
import { GALLERY_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { GalleryPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { GALLERY_OVERVIEW_QUERY } from "@/components/special/gallery-overview/queries";
import type { GalleryOverviewQueryLikeResult } from "@/components/special/gallery-overview/types";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";

interface GalleryOverviewClientProps {
  overviewData: GalleryOverviewQueryLikeResult;
  pageSettingsData: GalleryPageSettingsQueryLikeResult;
}

function filterPublishedProjects(overviewData: ReturnType<typeof normalizeGalleryOverviewQueryData>) {
  const edges = Array.isArray(overviewData.projectConnection?.edges) ? overviewData.projectConnection.edges : [];

  return {
    ...overviewData,
    projectConnection: {
      ...overviewData.projectConnection,
      edges: edges.filter((edge) => edge?.node?.published === true),
    },
  };
}

const GALLERY_PROJECT_GRID_TEMPLATE = "galleryProjectGrid";

function getStringField(record: Record<string, unknown> | null, field: string, fallback = "") {
  const value = record?.[field];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function ensureGalleryGridBlock(blocks: HomeBlock[], pageSettings: Record<string, unknown> | null): HomeBlock[] {
  const hasGrid = blocks.some((block) => resolveTemplateName(block) === GALLERY_PROJECT_GRID_TEMPLATE);
  if (hasGrid) return blocks;

  return [
    {
      _template: GALLERY_PROJECT_GRID_TEMPLATE,
      pageTitle: getStringField(pageSettings, "title", "Gallery"),
      galleryOverviewProjectCardImageSize: "card",
      galleryOverviewFilterImageSize: "thumb",
    } as HomeBlock,
    ...blocks,
  ];
}

function GalleryOverviewRenderer({
  overviewData,
  pageSettingsData,
}: {
  overviewData: unknown;
  pageSettingsData?: GalleryPageSettingsQueryLikeResult["data"];
}) {
  const normalized = filterPublishedProjects(normalizeGalleryOverviewQueryData(overviewData));
  const pageSettings = pageSettingsData?.galleryPageSettings || null;
  const pageSettingsRecord = pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null;
  const rawBlocks = Array.isArray(pageSettingsRecord?.blocks)
    ? pageSettingsRecord.blocks
    : [
        {
          _template: GALLERY_PROJECT_GRID_TEMPLATE,
          pageTitle: getStringField(pageSettingsRecord, "title", "Gallery"),
          galleryOverviewProjectCardImageSize: "card",
          galleryOverviewFilterImageSize: "thumb",
        },
        { _template: "sharedContactSection" },
        { _template: "sharedShowroomSection" },
      ];
  const resolvedBlocks = useResolvedSharedSectionBlocks(rawBlocks);
  const blocks = ensureGalleryGridBlock(resolvedBlocks as HomeBlock[], pageSettingsRecord);

  return (
    <div className="bg-white">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const key = `${template || "block"}-${index}`;

        if (template === GALLERY_PROJECT_GRID_TEMPLATE) {
          return (
            <GalleryOverviewPage
              contactBlock={null}
              data={normalized}
              filterImageSizeChoice={
                typeof blockRecord.galleryOverviewFilterImageSize === "string"
                  ? blockRecord.galleryOverviewFilterImageSize
                  : "thumb"
              }
              key={key}
              pageSettingsRecord={blockRecord}
              pageTitle={
                typeof blockRecord.pageTitle === "string"
                  ? blockRecord.pageTitle
                  : getStringField(pageSettingsRecord, "title", "Gallery")
              }
              projectCardImageSizeChoice={
                typeof blockRecord.galleryOverviewProjectCardImageSize === "string"
                  ? blockRecord.galleryOverviewProjectCardImageSize
                  : "card"
              }
            />
          );
        }

        return (
          <SharedPageSectionRenderer
            block={blockRecord}
            key={key}
            template={template}
          />
        );
      })}
    </div>
  );
}

function TinaGalleryOverview({
  overviewData,
  overviewQuery,
  pageSettingsData,
  settingsQuery,
}: GalleryOverviewClientProps & {
  overviewQuery: string;
  settingsQuery: string;
}) {
  const liveOverview = useTina({
    data: overviewData.data,
    query: overviewQuery,
    variables: overviewData.variables || {},
  });

  const liveSettings = useTina({
    data: pageSettingsData.data,
    query: settingsQuery,
    variables: pageSettingsData.variables || {},
  });

  return <GalleryOverviewRenderer overviewData={liveOverview.data} pageSettingsData={liveSettings.data} />;
}

export default function GalleryOverviewClient({ overviewData, pageSettingsData }: GalleryOverviewClientProps) {
  const { edit } = useEditState();
  const overviewQuery = overviewData.query?.trim() || GALLERY_OVERVIEW_QUERY;
  const hasLiveQuery = Boolean(overviewData.query?.trim());
  const settingsQuery = pageSettingsData.query?.trim() || GALLERY_PAGE_SETTINGS_QUERY;

  if (!hasLiveQuery && !edit) {
    return <GalleryOverviewRenderer overviewData={overviewData.data} pageSettingsData={pageSettingsData.data} />;
  }

  return (
    <TinaGalleryOverview
      overviewData={overviewData}
      overviewQuery={overviewQuery}
      pageSettingsData={pageSettingsData}
      settingsQuery={settingsQuery}
    />
  );
}
