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
  ...rest
}: SectionTitleProps & { tinaField?: string; "data-tina-field"?: string; [key: string]: any }) {
  const tinaFieldAttr = dataTinaField ?? _tinaField;
  return (
    <div className={`mb-10 ${centered ? "text-center" : ""}`}>
      <h2
        data-tina-field={tinaFieldAttr}
        className={`text-3xl md:text-4xl font-bold tracking-tight ${light ? "text-white" : "text-slate-800"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base md:text-lg ${light ? "text-slate-300" : "text-slate-500"}`}>
          {subtitle}
        </p>
      )}
      <div className={`mt-4 h-1 w-14 rounded-full bg-amber-500 ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}
