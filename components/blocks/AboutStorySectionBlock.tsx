import AboutStorySection from "@/components/about/AboutStorySection";
import type { BlockRecord } from "./block-types";

export default function AboutStorySectionBlock({ block }: { block: BlockRecord }) {
  return <AboutStorySection block={block as Record<string, unknown>} />;
}
