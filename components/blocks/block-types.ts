export interface BlockRecord {
  __typename?: string | null;
  [key: string]: unknown;
}

export function asBlockArray(value: unknown): BlockRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BlockRecord => Boolean(item) && typeof item === "object");
}

export function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export interface SharedSectionsData {
  contactSection?: Record<string, unknown> | null;
  showroomBanner?: Record<string, unknown> | null;
  aboutSection?: Record<string, unknown> | null;
}

const SINGLETON_BLOCK_MAP: Record<string, keyof SharedSectionsData> = {
  PageBlocksSharedContactSection: "contactSection",
  PageBlocksSharedShowroomBanner: "showroomBanner",
  PageBlocksSharedAboutSection: "aboutSection",
};

export function enrichBlocksWithSharedData(
  blocks: BlockRecord[],
  sharedSections: SharedSectionsData | null | undefined,
): BlockRecord[] {
  if (!sharedSections) return blocks;
  return blocks.map((block) => {
    const typename = block.__typename || "";
    const sectionKey = SINGLETON_BLOCK_MAP[typename];
    if (sectionKey) {
      const sharedData = sharedSections[sectionKey];
      if (sharedData) return { ...sharedData, ...block, __typename: typename };
    }
    return block;
  });
}
