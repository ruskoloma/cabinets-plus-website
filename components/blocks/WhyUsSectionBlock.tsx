import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function WhyUsSectionBlock({ block }: { block: BlockRecord }) {
  const features = asBlockArray(block.features);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title={asText(block.title)}
          subtitle={asText(block.subtitle) || undefined}
          tinaField={tinaField(block, "title")}
          centered
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-3xl mb-5">
                {asText(feature.icon)}
              </div>
              <h3
                data-tina-field={tinaField(feature, "title")}
                className="text-lg font-bold text-slate-800 mb-3"
              >
                  {asText(feature.title)}
                </h3>
              <p
                data-tina-field={tinaField(feature, "description")}
                className="text-slate-500 leading-relaxed text-sm"
              >
                  {asText(feature.description)}
                </p>
              </div>
          ))}
        </div>
      </div>
    </section>
  );
}
