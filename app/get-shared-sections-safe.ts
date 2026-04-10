import fs from "node:fs";
import path from "node:path";
import type { SharedSectionsData } from "@/components/blocks/block-types";
import { client } from "@/tina/__generated__/client";

export async function getSharedSectionsSafe(): Promise<SharedSectionsData> {
  try {
    const result = await client.queries.sharedSections({ relativePath: "shared-sections.json" });
    const data = result?.data?.sharedSections as Record<string, unknown> | undefined;
    if (data) {
      return {
        contactSection: data.contactSection as Record<string, unknown> | null,
        showroomBanner: data.showroomBanner as Record<string, unknown> | null,
        aboutSection: data.aboutSection as Record<string, unknown> | null,
      };
    }
  } catch {
    // Fall through to local file
  }

  try {
    const filePath = path.join(process.cwd(), "content", "global", "shared-sections.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      contactSection: (parsed.contactSection as Record<string, unknown>) || null,
      showroomBanner: (parsed.showroomBanner as Record<string, unknown>) || null,
      aboutSection: (parsed.aboutSection as Record<string, unknown>) || null,
    };
  } catch (error) {
    console.error("Unable to load shared sections:", error);
    return {};
  }
}
