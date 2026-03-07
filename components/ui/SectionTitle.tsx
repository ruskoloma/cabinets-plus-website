interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionTitle({
  title,
  subtitle,
  centered = false,
  light = false,
  tinaField: _tinaField,
  "data-tina-field": dataTinaField,
}: SectionTitleProps & { tinaField?: string; "data-tina-field"?: string }) {
  const tinaFieldAttr = dataTinaField ?? _tinaField;
  const classes = [
    "cp-section-title",
    centered ? "is-centered" : "",
    light ? "is-light" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <h2 data-tina-field={tinaFieldAttr}>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      <span className="cp-section-title__line" aria-hidden="true" />
    </div>
  );
}
