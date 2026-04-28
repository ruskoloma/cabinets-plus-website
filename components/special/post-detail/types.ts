import type { PostConnectionQuery, PostQuery } from "@/tina/__generated__/types";

export type PostDocument = NonNullable<PostQuery["post"]>;
export type PostEdge = NonNullable<PostConnectionQuery["postConnection"]["edges"]>[number];
export type PostConnectionNode = NonNullable<NonNullable<PostEdge>["node"]>;
