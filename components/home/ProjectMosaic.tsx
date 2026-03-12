interface ProjectMosaicProps {
  images: string[];
  imageFields?: string[];
}

export default function ProjectMosaic({ images, imageFields = [] }: ProjectMosaicProps) {
  const [first, ...rest] = images;

  return (
    <div className="mt-[15px] grid gap-[15px] md:mt-7 md:grid-cols-[674px_323px_323px] md:grid-rows-[243px_243px] md:gap-[28px]">
      <div className="h-[275px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:row-span-2 md:h-[514px] md:rounded-[2px]" data-tina-field={imageFields[0]}>
        {first ? <img alt="Project main" className="h-full w-full object-cover" src={first} /> : null}
      </div>

      {rest.slice(0, 4).map((image, index) => (
        <div className="h-[130px] overflow-hidden rounded-[1px] bg-[var(--cp-primary-100)] md:h-[243px] md:rounded-[2px]" data-tina-field={imageFields[index + 1]} key={`${image}-${index}`}>
          <img alt={`Project ${index + 2}`} className="h-full w-full object-cover" src={image} />
        </div>
      ))}
    </div>
  );
}
