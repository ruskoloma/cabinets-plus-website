import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function AboutSectionBlock({ block }: { block: BlockRecord }) {
  const stats = asBlockArray(block.stats);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <SectionTitle title={asText(block.title)} tinaField={tinaField(block, "title")} />
            <p
              data-tina-field={tinaField(block, "bodyText")}
              className="text-slate-500 leading-relaxed text-lg mt-6"
            >
              {asText(block.bodyText)}
            </p>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100"
              >
                <div
                  data-tina-field={tinaField(stat, "value")}
                  className="text-4xl font-bold text-amber-600 mb-2"
                >
                  {asText(stat.value)}
                </div>
                <div
                  data-tina-field={tinaField(stat, "label")}
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {asText(stat.label)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
