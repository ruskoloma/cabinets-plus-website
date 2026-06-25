import { tinaField } from "tinacms/dist/react";
import { FALLBACK_PROCESS_ICONS, type ProcessItem } from "@/app/figma-home.helpers";
import ProcessTimeline from "@/components/home/ProcessTimeline";
import SectionTitle from "@/components/ui/SectionTitle";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function ProcessSectionBlock({ block }: { block: BlockRecord }) {
  const steps: ProcessItem[] = asBlockArray(block.steps)
    .map((step) => ({
      raw: step,
      iconImage: asText(step.iconImage) || undefined,
      title: asText(step.title),
      description: asText(step.description),
    }))
    .filter((step) => step.title.length > 0);

  return (
    <section className="py-20 bg-[var(--cp-brand-neutral-50)]">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle title={asText(block.title)} tinaField={tinaField(block, "title")} centered />
        <ProcessTimeline fallbackIcons={FALLBACK_PROCESS_ICONS} items={steps} keyPrefix="shared-process" />
      </div>
    </section>
  );
}
