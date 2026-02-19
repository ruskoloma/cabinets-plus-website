import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";

export default function HeroBlock({ block }: { block: any }) {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-slate-800 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-600/10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-2xl">
          <span className="inline-block text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
            Spokane, WA
          </span>
          <h1
            data-tina-field={tinaField(block, "heading")}
            className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
          >
            {block.heading}
          </h1>
          <p
            data-tina-field={tinaField(block, "subtext")}
            className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10"
          >
            {block.subtext}
          </p>
          {block.ctaLabel && (
            <Button href={block.ctaLink || "#"} className="px-8 py-4 text-base">
              {block.ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
