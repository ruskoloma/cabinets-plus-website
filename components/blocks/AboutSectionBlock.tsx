import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";

export default function AboutSectionBlock({ block }: { block: any }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <SectionTitle title={block.title} tinaField={tinaField(block, "title")} />
            <p
              data-tina-field={tinaField(block, "bodyText")}
              className="text-slate-500 leading-relaxed text-lg mt-6"
            >
              {block.bodyText}
            </p>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {block.stats?.map((stat: any, i: number) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100"
              >
                <div
                  data-tina-field={tinaField(stat, "value")}
                  className="text-4xl font-bold text-amber-600 mb-2"
                >
                  {stat.value}
                </div>
                <div
                  data-tina-field={tinaField(stat, "label")}
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
