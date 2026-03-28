import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import { asText, type BlockRecord } from "./block-types";

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

export default function ProjectsSectionBlock({ block }: { block: BlockRecord }) {
  const images = Array.isArray(block.images) && block.images.length > 0
    ? block.images
    : Array<string | null>(6).fill(null);
  const imageVariant = resolveConfiguredImageVariant(block.imageSize, "card");

  return (
    <section className="py-20 bg-slate-900" id="projects">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title={asText(block.title)}
          tinaField={tinaField(block, "title")}
          light
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {images.slice(0, 6).map((image, i) => {
            const img = typeof image === "string" ? image : null;

            return (
            <div
              key={i}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl shadow-lg transition-shadow duration-300 hover:shadow-2xl"
            >
              {img ? (
                <FillImage alt={PROJECT_LABELS[i]} className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(min-width: 768px) 33vw, 50vw" src={img} variant={imageVariant} />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${PROJECT_COLORS[i]} group-hover:scale-110 transition-transform duration-500`} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-white font-semibold text-sm">{PROJECT_LABELS[i]}</span>
              </div>
            </div>
            );
          })}
        </div>
        {asText(block.ctaLabel) && (
          <div className="mt-10 text-center">
            <Button href={asText(block.ctaLink, "#")} variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-600 hover:text-white">
              {asText(block.ctaLabel)}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
