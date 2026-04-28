"use client";

import { useEditState, useTina } from "tinacms/dist/react";
import BlogOverviewPage from "@/components/special/blog-overview/BlogOverviewPage";
import { BLOG_POSTS_QUERY } from "@/components/special/blog-overview/queries";
import type { BlogPostsQueryLikeResult } from "@/components/special/blog-overview/types";
import { BLOG_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { BlogPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";

interface BlogClientProps {
  postsData: BlogPostsQueryLikeResult;
  pageSettingsData: BlogPageSettingsQueryLikeResult;
}

const BLOG_POSTS_GRID_TEMPLATE = "blogPostsGrid";

function getStringField(record: Record<string, unknown> | null, field: string, fallback = "") {
  const value = record?.[field];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function getNumberField(record: Record<string, unknown> | null, field: string): number | null {
  const value = record?.[field];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function ensureBlogGridBlock(blocks: HomeBlock[], pageSettings: Record<string, unknown> | null): HomeBlock[] {
  const hasGrid = blocks.some((block) => resolveTemplateName(block) === BLOG_POSTS_GRID_TEMPLATE);
  if (hasGrid) return blocks;

  return [
    {
      _template: BLOG_POSTS_GRID_TEMPLATE,
      pageTitle: getStringField(pageSettings, "title", "Blog"),
      postCardImageSize: "card",
      postsPerPage: 12,
    } as HomeBlock,
    ...blocks,
  ];
}

function BlogRenderer({
  postsData,
  pageSettingsData,
}: {
  postsData: BlogPostsQueryLikeResult["data"];
  pageSettingsData?: BlogPageSettingsQueryLikeResult["data"];
}) {
  const pageSettings = pageSettingsData?.blogPageSettings || null;
  const pageSettingsRecord = pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null;
  const rawBlocks = Array.isArray(pageSettingsRecord?.blocks)
    ? pageSettingsRecord.blocks
    : [
        {
          _template: BLOG_POSTS_GRID_TEMPLATE,
          pageTitle: getStringField(pageSettingsRecord, "title", "Blog"),
          postCardImageSize: "card",
          postsPerPage: 12,
        },
        { _template: "sharedContactSection" },
      ];
  const resolvedBlocks = useResolvedSharedSectionBlocks(rawBlocks);
  const blocks = ensureBlogGridBlock(resolvedBlocks as HomeBlock[], pageSettingsRecord);

  return (
    <div className="bg-white">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const key = `${template || "block"}-${index}`;

        if (template === BLOG_POSTS_GRID_TEMPLATE) {
          return (
            <BlogOverviewPage
              data={postsData}
              key={key}
              pageSettingsRecord={blockRecord}
              pageTitle={
                typeof blockRecord.pageTitle === "string"
                  ? blockRecord.pageTitle
                  : getStringField(pageSettingsRecord, "title", "Blog")
              }
              postCardImageSizeChoice={
                typeof blockRecord.postCardImageSize === "string" ? blockRecord.postCardImageSize : "card"
              }
              postsPerPage={getNumberField(blockRecord, "postsPerPage")}
            />
          );
        }

        return <SharedPageSectionRenderer block={blockRecord} key={key} template={template} />;
      })}
    </div>
  );
}

function TinaBlog({
  postsData,
  postsQuery,
  pageSettingsData,
  settingsQuery,
}: BlogClientProps & {
  postsQuery: string;
  settingsQuery: string;
}) {
  const livePosts = useTina({
    data: postsData.data,
    query: postsQuery,
    variables: postsData.variables || {},
  });

  const liveSettings = useTina({
    data: pageSettingsData.data,
    query: settingsQuery,
    variables: pageSettingsData.variables || {},
  });

  return <BlogRenderer pageSettingsData={liveSettings.data} postsData={livePosts.data} />;
}

export default function BlogClient({ postsData, pageSettingsData }: BlogClientProps) {
  const { edit } = useEditState();
  const postsQuery = postsData.query?.trim() || BLOG_POSTS_QUERY;
  const hasLiveQuery = Boolean(postsData.query?.trim());
  const settingsQuery = pageSettingsData.query?.trim() || BLOG_PAGE_SETTINGS_QUERY;

  if (!hasLiveQuery && !edit) {
    return <BlogRenderer pageSettingsData={pageSettingsData.data} postsData={postsData.data} />;
  }

  return (
    <TinaBlog
      pageSettingsData={pageSettingsData}
      postsData={postsData}
      postsQuery={postsQuery}
      settingsQuery={settingsQuery}
    />
  );
}
