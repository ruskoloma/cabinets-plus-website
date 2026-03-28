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
}

export default function PreviewCard({
  title,
  image,
  href,
  description,
  imageClassName = "h-[440px]",
  wrapperClassName = "",
  titleClassName = "mt-3 text-2xl font-semibold capitalize text-[var(--cp-primary-500)]",
  descriptionClassName = "mt-2 text-lg leading-relaxed text-[var(--cp-primary-500)]",
  tinaCardField,
  tinaImageField,
  tinaTitleField,
  tinaDescriptionField,
  imageVariant,
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
      </div>
      <h3 className={titleClassName} data-tina-field={tinaTitleField}>
        {title}
      </h3>
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
