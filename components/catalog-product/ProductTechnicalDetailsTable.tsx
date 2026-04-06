import type { ProductTechnicalDetailViewModel } from "./types";

interface ProductTechnicalDetailsTableProps {
  details: ProductTechnicalDetailViewModel[];
}

function getValue(detail: ProductTechnicalDetailViewModel): string {
  const value = detail.value?.trim() || "";
  const unit = detail.unit?.trim() || "";
  return [value, unit].filter(Boolean).join(" ");
}

export default function ProductTechnicalDetailsTable({ details }: ProductTechnicalDetailsTableProps) {
  if (!details.length) return null;

  return (
    <div className="mt-4">
      {details.map((detail, index) => (
        <div
          className="grid h-10 grid-cols-[189px_minmax(0,1fr)] items-center border-b border-[var(--cp-primary-100)] md:grid-cols-2"
          key={`${detail.key || "detail"}-${index}`}
        >
          <p className="pr-3 text-sm font-semibold leading-[1.4] text-[var(--cp-primary-500)]" data-tina-field={detail.keyTinaField}>
            {detail.key}
          </p>
          <p className="pr-3 text-sm leading-[1.4] text-[var(--cp-primary-500)]" data-tina-field={detail.valueTinaField}>
            {getValue(detail)}
          </p>
        </div>
      ))}
    </div>
  );
}
