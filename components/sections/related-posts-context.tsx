"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PostConnectionNode } from "@/components/special/post-detail/types";

const RelatedPostsContext = createContext<PostConnectionNode[]>([]);

export function RelatedPostsProvider({
  children,
  posts,
}: {
  children: ReactNode;
  posts: PostConnectionNode[] | null | undefined;
}) {
  const value = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);
  return <RelatedPostsContext.Provider value={value}>{children}</RelatedPostsContext.Provider>;
}

export function useRelatedPosts(): PostConnectionNode[] {
  return useContext(RelatedPostsContext);
}
