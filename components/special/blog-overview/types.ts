export interface BlogPostNode {
  id?: string;
  _sys?: {
    filename?: string;
    basename?: string;
    relativePath?: string;
  } | null;
  title?: string | null;
  date?: string | null;
  thumbnail?: string | null;
  subtitle?: string | null;
  hideInFeed?: boolean | null;
  [key: string]: unknown;
}

export interface BlogPostsDataShape {
  postConnection?: {
    edges?: Array<{ node?: BlogPostNode | null } | null> | null;
  } | null;
}

export interface BlogPostsQueryLikeResult {
  data: BlogPostsDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}
