"use client";

import { useTina } from "tinacms/dist/react";
import { POST_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { PostPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import PostDetailPage from "@/components/special/post-detail/PostDetailPage";
import type {
  PostConnectionNode,
} from "@/components/special/post-detail/types";
import type {
  PostConnectionQuery,
  PostConnectionQueryVariables,
  PostQuery,
  PostQueryVariables,
} from "@/tina/__generated__/types";

interface PostsQueryLikeResult {
  data: PostConnectionQuery;
  query: string;
  variables: PostConnectionQueryVariables;
}

interface PostClientProps {
  data: PostQuery;
  query: string;
  variables: PostQueryVariables;
  postsData: PostsQueryLikeResult;
  pageSettingsData: PostPageSettingsQueryLikeResult;
}

export default function PostClient(props: PostClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query,
    variables: props.variables,
  });
  const { data: postsQueryData } = useTina({
    data: props.postsData.data,
    query: props.postsData.query,
    variables: props.postsData.variables,
  });
  const { data: pageSettingsData } = useTina({
    data: props.pageSettingsData.data,
    query: props.pageSettingsData.query?.trim() || POST_PAGE_SETTINGS_QUERY,
    variables: props.pageSettingsData.variables || {},
  });

  const post = data.post;
  if (!post) return null;

  const livePosts = (postsQueryData.postConnection.edges || [])
    .map((edge) => edge?.node)
    .filter((node): node is PostConnectionNode => Boolean(node));

  const pageSettings = pageSettingsData.postPageSettings || null;
  const pageSettingsRecord =
    pageSettings && typeof pageSettings === "object"
      ? (pageSettings as Record<string, unknown>)
      : null;

  return <PostDetailPage pageSettingsRecord={pageSettingsRecord} post={post} posts={livePosts} />;
}
