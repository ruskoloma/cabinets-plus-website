import TrustMessageStrip from "@/components/home/TrustMessageStrip";
import type { BlockRecord } from "./block-types";

export default function TrustMessageStripBlock({ block }: { block: BlockRecord }) {
  return <TrustMessageStrip block={block as Record<string, unknown>} />;
}
