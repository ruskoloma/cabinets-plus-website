import { asRecord, asString, readJsonContentFile } from "@/app/lib/content";
import type { CabinetPageSettings } from "@/components/cabinet-door/types";

export async function getCabinetPageSettingsSafe(): Promise<CabinetPageSettings | null> {
  try {
    const parsed = await readJsonContentFile("global", "cabinet-page-settings.json");
    const record = asRecord(parsed);
    if (!record) return null;

    const mockProjects = Array.isArray(record.mockProjects)
      ? record.mockProjects
          .map((item) => {
            const row = asRecord(item);
            if (!row) return null;
            return {
              file: asString(row.file) ?? null,
              title: asString(row.title) ?? null,
            };
          })
          .filter(Boolean)
      : [];

    return {
      breadcrumbLabel: asString(record.breadcrumbLabel) ?? null,
      technicalDetailsTitle: asString(record.technicalDetailsTitle) ?? null,
      contactButtonLabel: asString(record.contactButtonLabel) ?? null,
      descriptionLabel: asString(record.descriptionLabel) ?? null,
      relatedProductsTitle: asString(record.relatedProductsTitle) ?? null,
      projectsSectionTitle: asString(record.projectsSectionTitle) ?? null,
      projectsSectionDescription: asString(record.projectsSectionDescription) ?? null,
      projectFallbackTitle: asString(record.projectFallbackTitle) ?? null,
      mockProjects,
    };
  } catch {
    return null;
  }
}
