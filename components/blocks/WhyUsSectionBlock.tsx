import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";

export default function WhyUsSectionBlock({ block }: { block: any }) {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title={block.title}
          subtitle={block.subtitle}
          tinaField={tinaField(block, "title")}
          centered
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {block.features?.map((feature: any, i: number) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-3xl mb-5">
                {feature.icon}
              </div>
              <h3
                data-tina-field={tinaField(feature, "title")}
                className="text-lg font-bold text-slate-800 mb-3"
              >
                {feature.title}
              </h3>
              <p
                data-tina-field={tinaField(feature, "description")}
                className="text-slate-500 leading-relaxed text-sm"
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
