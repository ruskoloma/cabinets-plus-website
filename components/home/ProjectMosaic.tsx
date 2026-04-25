import Link from "next/link";
import FillImage from "@/components/ui/FillImage";
import type { ImageVariantPreset } from "@/lib/image-variants";

export interface ProjectMosaicItem {
  image: string;
  title: string;
  href: string;
  tinaField?: string;
}

interface ProjectMosaicProps {
  items: ProjectMosaicItem[];
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

interface TileProps {
  item: ProjectMosaicItem;
  className: string;
  imageVariant?: ImageVariantPreset;
  imageSizes: string;
  priority?: boolean;
  fallbackAlt: string;
}

function MosaicTile({ item, className, imageVariant, imageSizes, priority, fallbackAlt }: TileProps) {
  const alt = item.title || fallbackAlt;
  const content = (
    <>
      {item.image ? (
        <FillImage
          alt={alt}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority={priority}
          sizes={imageSizes}
          src={item.image}
          variant={imageVariant}
        />
      ) : null}
      <ProjectHoverOverlay title={item.title} />
    </>
  );

  if (item.href) {
    return (
      <Link aria-label={alt} className={className} data-tina-field={item.tinaField} href={item.href}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} data-tina-field={item.tinaField}>
      {content}
    </div>
  );
}

export default function ProjectMosaic({ items, imageVariant }: ProjectMosaicProps) {
  if (items.length === 0) return null;

  const [first, ...rest] = items;
  const secondaryItems = rest.slice(0, 4);
  const featureVariant = imageVariant === null ? undefined : (imageVariant ?? "feature");
  const cardVariant = imageVariant === null ? undefined : (imageVariant ?? "card");

  return (
    <div className="mt-8 flex flex-col gap-[15px] md:mt-4 md:grid md:grid-cols-[674px_323px_323px] md:grid-rows-[243px_243px] md:gap-[28px]">
      <MosaicTile
        className="group relative block h-[275px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:row-span-2 md:h-[514px] md:rounded-[2px]"
        fallbackAlt="Project main"
        imageSizes="(min-width: 768px) 48vw, 100vw"
        imageVariant={featureVariant}
        item={first}
        priority
      />

      <div className="grid grid-cols-2 gap-[15px] md:contents">
        {secondaryItems.map((item, index) => (
          <MosaicTile
            className="group relative block h-[130px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:h-[243px] md:rounded-[2px]"
            fallbackAlt={`Project ${index + 2}`}
            imageSizes="(min-width: 768px) 24vw, 50vw"
            imageVariant={cardVariant}
            item={item}
            key={`${item.href}-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
