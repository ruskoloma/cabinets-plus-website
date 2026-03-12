import Link from "next/link";

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
}: PreviewCardProps) {
  const content = (
    <>
      <div className={`overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] ${imageClassName}`} data-tina-field={tinaImageField}>
        {image ? <img alt={title} className="h-full w-full object-cover" src={image} /> : null}
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
        <div className={`overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] ${imageClassName}`} data-tina-field={tinaImageField}>
          {image ? (
            <img alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" src={image} />
          ) : null}
        </div>
        <h3 className={titleClassName} data-tina-field={tinaTitleField}>
          {title}
        </h3>
        {description ? (
          <p className={descriptionClassName} data-tina-field={tinaDescriptionField}>
            {description}
          </p>
        ) : null}
      </Link>
    );
  }

  return (
    <article className={wrapperClassName} data-tina-field={tinaCardField}>
      {content}
    </article>
  );
}
