"use client";

import { tinaField } from "tinacms/dist/react";
import type { CabinetTechnicalDetail } from "./types";

interface CabinetTechnicalDetailsTableProps {
  details: CabinetTechnicalDetail[];
}

function getValue(detail: CabinetTechnicalDetail): string {
  const value = detail.value?.trim() || "";
  const unit = detail.unit?.trim() || "";
  return [value, unit].filter(Boolean).join(" ");
}

export default function CabinetTechnicalDetailsTable({ details }: CabinetTechnicalDetailsTableProps) {
  if (!details.length) return null;

  return (
    <div className="mt-4 border-t border-[var(--cp-primary-100)]">
      {details.map((detail, index) => (
        <div className="grid grid-cols-2 gap-5 border-b border-[var(--cp-primary-100)] py-[11px]" key={`${detail.key || "detail"}-${index}`}>
          <p className="text-sm font-semibold leading-[1.4] text-[var(--cp-primary-500)]" data-tina-field={tinaField(detail as unknown as Record<string, unknown>, "key")}>
            {detail.key}
          </p>
          <p className="text-sm leading-[1.4] text-[var(--cp-primary-500)]" data-tina-field={tinaField(detail as unknown as Record<string, unknown>, "value")}>
            {getValue(detail)}
          </p>
        </div>
      ))}
    </div>
  );
}
