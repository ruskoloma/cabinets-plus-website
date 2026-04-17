import FillImage from "@/components/ui/FillImage";
import type { ImageVariantPreset } from "@/lib/image-variants";

interface ProjectMosaicProps {
  images: string[];
  titles?: string[];
  imageFields?: string[];
  imageVariant?: ImageVariantPreset | null;
}

function ProjectHoverOverlay({ title }: { title?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end gap-3 bg-[rgba(0,0,0,0.4)] p-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
      {title ? (
        <span className="text-[24px] font-normal leading-[1.25] text-white">
          {title}
        </span>
      ) : null}
      <span className="pointer-events-auto inline-flex min-h-[48px] w-max items-center justify-center rounded-[2px] border border-white bg-transparent px-8 text-[16px] font-medium leading-[1.2] text-white transition-colors duration-150 hover:bg-white/10">
        View
      </span>
    </div>
  );
}

export default function ProjectMosaic({ images, titles = [], imageFields = [], imageVariant }: ProjectMosaicProps) {
  const [first, ...rest] = images;
  const secondaryImages = rest.slice(0, 4);
  const firstTitle = titles[0];

  return (
    <div className="mt-8 flex flex-col gap-[15px] md:mt-4 md:grid md:grid-cols-[674px_323px_323px] md:grid-rows-[243px_243px] md:gap-[28px]">
      <div className="group relative h-[275px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:row-span-2 md:h-[514px] md:rounded-[2px]" data-tina-field={imageFields[0]}>
        {first ? <FillImage alt={firstTitle || "Project main"} className="object-cover" priority sizes="(min-width: 768px) 48vw, 100vw" src={first} variant={imageVariant === null ? undefined : (imageVariant ?? "feature")} /> : null}
        <ProjectHoverOverlay title={firstTitle} />
      </div>

      <div className="grid grid-cols-2 gap-[15px] md:contents">
        {secondaryImages.map((image, index) => {
          const title = titles[index + 1];
          return (
            <div className="group relative h-[130px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:h-[243px] md:rounded-[2px]" data-tina-field={imageFields[index + 1]} key={`${image}-${index}`}>
              <FillImage alt={title || `Project ${index + 2}`} className="object-cover" sizes="(min-width: 768px) 24vw, 50vw" src={image} variant={imageVariant === null ? undefined : (imageVariant ?? "card")} />
              <ProjectHoverOverlay title={title} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
