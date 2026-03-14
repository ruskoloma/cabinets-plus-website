import FillImage from "@/components/ui/FillImage";
import type { ProductProjectCardItem } from "./types";

interface ProductProjectStripProps {
  items: ProductProjectCardItem[];
  title: string;
  description: string;
}

export default function ProductProjectStrip({ items, title, description }: ProductProjectStripProps) {
  if (!items.length) return null;

  return (
    <section className="bg-[var(--cp-brand-neutral-50)]">
      <div className="cp-container px-4 py-14 md:px-8 md:py-16">
        <h2 className="font-[var(--font-red-hat-display)] text-[28px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[32px]">
          {title}
        </h2>
        <p className="mt-3 max-w-[1024px] text-[18px] leading-[1.5] text-[var(--cp-primary-500)] md:text-[24px]">
          {description}
        </p>

        <div className="cp-hide-scrollbar mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-5 md:gap-8">
            {items.map((project, index) => (
              <article className="w-[293px] md:w-[426px]" key={`${project.file}-${index}`}>
                <div className="relative h-[215px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[312px]" data-tina-field={project.imageTinaField}>
                  <FillImage alt={project.title} className="object-cover" sizes="(min-width: 768px) 426px, 293px" src={project.file} />
                </div>
                <p
                  className="mt-2 font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:mt-3 md:text-[24px]"
                  data-tina-field={project.titleTinaField}
                >
                  {project.title}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
