import FillImage from "@/components/ui/FillImage";
import type { ImageVariantPreset } from "@/lib/image-variants";

interface ProjectMosaicProps {
  images: string[];
  imageFields?: string[];
  imageVariant?: ImageVariantPreset | null;
}

export default function ProjectMosaic({ images, imageFields = [], imageVariant }: ProjectMosaicProps) {
  const [first, ...rest] = images;
  const secondaryImages = rest.slice(0, 4);

  return (
    <div className="mt-4 flex flex-col gap-[15px] md:mt-7 md:grid md:grid-cols-[674px_323px_323px] md:grid-rows-[243px_243px] md:gap-[28px]">
      <div className="relative h-[275px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:row-span-2 md:h-[514px] md:rounded-[2px]" data-tina-field={imageFields[0]}>
        {first ? <FillImage alt="Project main" className="object-cover" priority sizes="(min-width: 768px) 48vw, 100vw" src={first} variant={imageVariant === null ? undefined : (imageVariant ?? "feature")} /> : null}
      </div>

      <div className="grid grid-cols-2 gap-[15px] md:contents">
        {secondaryImages.map((image, index) => (
          <div className="relative h-[130px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:h-[243px] md:rounded-[2px]" data-tina-field={imageFields[index + 1]} key={`${image}-${index}`}>
            <FillImage alt={`Project ${index + 2}`} className="object-cover" sizes="(min-width: 768px) 24vw, 50vw" src={image} variant={imageVariant === null ? undefined : (imageVariant ?? "card")} />
          </div>
        ))}
      </div>
    </div>
  );
}
