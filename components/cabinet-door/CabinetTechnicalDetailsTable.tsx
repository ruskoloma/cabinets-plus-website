"use client";

import { tinaField } from "tinacms/dist/react";
import ProductTechnicalDetailsTable from "@/components/catalog-product/ProductTechnicalDetailsTable";
import type { CabinetTechnicalDetail } from "./types";

interface CabinetTechnicalDetailsTableProps {
  details: CabinetTechnicalDetail[];
}

export default function CabinetTechnicalDetailsTable({ details }: CabinetTechnicalDetailsTableProps) {
  return (
    <ProductTechnicalDetailsTable
      details={details.map((detail) => ({
        key: detail.key,
        value: detail.value,
        keyTinaField: tinaField(detail as unknown as Record<string, unknown>, "key"),
        valueTinaField: tinaField(detail as unknown as Record<string, unknown>, "value"),
      }))}
    />
  );
}
