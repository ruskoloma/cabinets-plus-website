import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";

export default function ShowroomBannerBlock({ block }: { block: any }) {
  return (
    <section className="py-24 bg-amber-600 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-700/40 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2
          data-tina-field={tinaField(block, "heading")}
          className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight"
        >
          {block.heading}
        </h2>
        <p
          data-tina-field={tinaField(block, "subtext")}
          className="text-amber-100 text-lg leading-relaxed mb-10"
        >
          {block.subtext}
        </p>
        {block.ctaLabel && (
          <Button href={block.ctaLink || "#"} variant="secondary" className="px-8 py-4 text-base">
            {block.ctaLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
