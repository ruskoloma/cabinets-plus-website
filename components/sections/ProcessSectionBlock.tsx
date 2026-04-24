import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function ProcessSectionBlock({ block }: { block: BlockRecord }) {
  const steps = asBlockArray(block.steps);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle title={asText(block.title)} tinaField={tinaField(block, "title")} centered />
        <div className="relative mt-12">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-amber-200 mx-20" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-lg mb-5">
                  {asText(step.number)}
                </div>
                <h3
                  data-tina-field={tinaField(step, "title")}
                  className="text-base font-bold text-slate-800 mb-2"
                >
                  {asText(step.title)}
                </h3>
                <p
                  data-tina-field={tinaField(step, "description")}
                  className="text-sm text-slate-500 leading-relaxed"
                >
                  {asText(step.description)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
