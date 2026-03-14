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
    <div className="mt-4 border-t border-[var(--cp-primary-100)]">
      {details.map((detail, index) => (
        <div className="grid grid-cols-2 gap-5 border-b border-[var(--cp-primary-100)] py-[11px]" key={`${detail.key || "detail"}-${index}`}>
          <p className="text-sm font-semibold leading-[1.4] text-[var(--cp-primary-500)]" data-tina-field={detail.keyTinaField}>
            {detail.key}
          </p>
          <p className="text-sm leading-[1.4] text-[var(--cp-primary-500)]" data-tina-field={detail.valueTinaField}>
            {getValue(detail)}
          </p>
        </div>
      ))}
    </div>
  );
}
