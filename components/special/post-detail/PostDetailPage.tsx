"use client";

import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks } from "@/components/shared/use-shared-sections";
import PostContentSection from "./PostContentSection";
import PostRelatedArticlesSection from "./PostRelatedArticlesSection";
import type { PostConnectionNode, PostDocument } from "./types";

const POST_CONTENT_TEMPLATE = "postContent";
const POST_RELATED_TEMPLATE = "postRelatedArticles";

function ensurePostContentBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasContent = blocks.some((block) => resolveTemplateName(block) === POST_CONTENT_TEMPLATE);
  if (hasContent) return blocks;
  return [{ _template: POST_CONTENT_TEMPLATE } as HomeBlock, ...blocks];
}

interface PostDetailPageProps {
  post: PostDocument;
  posts: PostConnectionNode[];
  pageSettingsRecord?: Record<string, unknown> | null;
}

export default function PostDetailPage({ post, posts, pageSettingsRecord }: PostDetailPageProps) {
  const rawBlocks = useResolvedSharedSectionBlocks(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensurePostContentBlock(rawBlocks as HomeBlock[]);

  return (
    <article className="bg-white text-[var(--cp-primary-500)]">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case POST_CONTENT_TEMPLATE:
            return <PostContentSection block={blockRecord} key={key} post={post} />;

          case POST_RELATED_TEMPLATE:
            return (
              <PostRelatedArticlesSection block={blockRecord} key={key} post={post} posts={posts} />
            );

          default:
            return <SharedPageSectionRenderer block={blockRecord} key={key} template={template} />;
        }
      })}
    </article>
  );
}
