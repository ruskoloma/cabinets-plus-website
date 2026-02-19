import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";

const PROJECT_COLORS = [
  "from-amber-800 to-amber-600",
  "from-slate-700 to-slate-500",
  "from-stone-800 to-stone-600",
  "from-amber-700 to-amber-500",
  "from-zinc-700 to-zinc-500",
  "from-stone-700 to-amber-600",
];

const PROJECT_LABELS = [
  "Modern Kitchen", "Bathroom Remodel", "Quartz Countertops",
  "Custom Cabinets", "Flooring Install", "Full Kitchen Renovation",
];

export default function ProjectsSectionBlock({ block }: { block: any }) {
  const images = block.images?.length ? block.images : Array(6).fill(null);

  return (
    <section className="py-20 bg-slate-900" id="projects">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title={block.title}
          tinaField={tinaField(block, "title")}
          light
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {images.slice(0, 6).map((img: string | null, i: number) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden aspect-[4/3] shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              {img ? (
                <img src={img} alt={PROJECT_LABELS[i]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${PROJECT_COLORS[i]} group-hover:scale-110 transition-transform duration-500`} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-white font-semibold text-sm">{PROJECT_LABELS[i]}</span>
              </div>
            </div>
          ))}
        </div>
        {block.ctaLabel && (
          <div className="mt-10 text-center">
            <Button href={block.ctaLink || "#"} variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-600 hover:text-white">
              {block.ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
