"use client";

import { useMemo } from "react";
import { useSharedSections } from "@/components/layout/GlobalContext";
import {
  readSharedSectionBlock,
  resolveSharedSectionBlocks,
  type SharedSectionsDocument,
} from "@/components/shared/shared-sections";

export function useResolvedSharedSectionBlocks(blocks: unknown): Record<string, unknown>[] {
  const sharedSections = useSharedSections();
  return useMemo(() => resolveSharedSectionBlocks(blocks, sharedSections), [blocks, sharedSections]);
}

export function useSharedSectionBlock(key: keyof SharedSectionsDocument): Record<string, unknown> | null {
  const sharedSections = useSharedSections();
  return readSharedSectionBlock(sharedSections, key);
}
