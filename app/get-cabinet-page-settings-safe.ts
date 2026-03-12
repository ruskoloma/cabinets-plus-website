import fs from "node:fs/promises";
import path from "node:path";
import type { CabinetPageSettings } from "@/components/cabinet-door/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function getCabinetPageSettingsSafe(): Promise<CabinetPageSettings | null> {
  try {
    const filePath = path.join(process.cwd(), "content", "global", "cabinet-page-settings.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    if (!record) return null;

    const mockProjects = Array.isArray(record.mockProjects)
      ? record.mockProjects
          .map((item) => {
            const row = asRecord(item);
            if (!row) return null;
            return {
              file: asString(row.file),
              title: asString(row.title),
            };
          })
          .filter(Boolean)
      : [];

    return {
      breadcrumbLabel: asString(record.breadcrumbLabel),
      technicalDetailsTitle: asString(record.technicalDetailsTitle),
      contactButtonLabel: asString(record.contactButtonLabel),
      descriptionLabel: asString(record.descriptionLabel),
      relatedProductsTitle: asString(record.relatedProductsTitle),
      projectsSectionTitle: asString(record.projectsSectionTitle),
      projectsSectionDescription: asString(record.projectsSectionDescription),
      projectFallbackTitle: asString(record.projectFallbackTitle),
      mockProjects,
    };
  } catch {
    return null;
  }
}
