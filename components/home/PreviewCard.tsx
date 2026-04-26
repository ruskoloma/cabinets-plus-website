import Link from "next/link";
import FillImage from "@/components/ui/FillImage";
import type { ImageVariantPreset } from "@/lib/image-variants";

interface PreviewCardProps {
  title: string;
  image?: string;
  href?: string;
  description?: string;
  imageClassName?: string;
  wrapperClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  tinaCardField?: string;
  tinaImageField?: string;
  tinaTitleField?: string;
  tinaDescriptionField?: string;
  imageVariant?: ImageVariantPreset | null;
  showMobileChevron?: boolean;
  hoverViewLabel?: string;
}

export default function PreviewCard({
  title,
  image,
  href,
  description,
  imageClassName = "h-[440px]",
  wrapperClassName = "",
  titleClassName = "mt-3 text-2xl font-normal capitalize text-[var(--cp-primary-500)]",
  descriptionClassName = "mt-2 text-lg leading-relaxed text-[var(--cp-primary-500)]",
  tinaCardField,
  tinaImageField,
  tinaTitleField,
  tinaDescriptionField,
  imageVariant,
  showMobileChevron = true,
  hoverViewLabel = "View",
}: PreviewCardProps) {
  const imageClasses = [
    "h-full w-full object-cover",
    href ? "transition-transform duration-300 group-hover:scale-[1.03]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className={`relative overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] ${imageClassName}`} data-tina-field={tinaImageField}>
        {image ? <FillImage alt={title} className={imageClasses} sizes="(min-width: 768px) 25vw, 100vw" src={image} variant={imageVariant === null ? undefined : (imageVariant ?? "card")} /> : null}
        {href ? (
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-[rgba(38,38,35,0.4)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
            <span className="inline-flex min-h-[48px] items-center justify-center rounded-[2px] border border-white bg-transparent px-8 text-[20px] font-medium leading-[1.2] text-white">
              {hoverViewLabel}
            </span>
          </div>
        ) : null}
      </div>
      {showMobileChevron && href ? (
        <>
          <div className="mt-2 flex items-center gap-1.5 md:hidden" data-tina-field={tinaTitleField}>
            <h3 className="font-[var(--font-red-hat-display)] text-[16px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)]">
              {title}
            </h3>
            <img
              alt=""
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
              src="/library/header/nav-chevron-right.svg"
            />
          </div>
          <h3 className={`hidden md:block ${titleClassName}`} data-tina-field={tinaTitleField}>
            {title}
          </h3>
        </>
      ) : (
        <h3 className={titleClassName} data-tina-field={tinaTitleField}>
          {title}
        </h3>
      )}
      {description ? (
        <p className={descriptionClassName} data-tina-field={tinaDescriptionField}>
          {description}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className={`group block ${wrapperClassName}`} data-tina-field={tinaCardField} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <article className={wrapperClassName} data-tina-field={tinaCardField}>
      {content}
    </article>
  );
}
