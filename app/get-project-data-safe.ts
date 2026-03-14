import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { client } from "@/tina/__generated__/client";
import { PROJECT_LIVE_QUERY } from "@/app/project-live-query";
import { normalizeProjectQueryData } from "@/components/project-detail/normalize-project-query";
import type { ProjectDetailQueryLikeResult } from "@/components/project-detail/types";

const LEGACY_PROJECT_REDIRECTS: Record<string, string> = {
  "custom-kitchen-cabinetry-collection": "/gallery",
  "modern-bathroom-vanity-collection": "/gallery",
  "modern-custom-cabinetry-collection": "/gallery",
};

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^content\//i, "")
    .replace(/^projects\//i, "")
    .replace(/\s+/g, "-");
}

function isMissingProjectError(error: unknown, relativePath: string): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes(`Unable to find record content/projects/${relativePath}`);
}

let projectIndexCache: Array<{ slug: string }> | null = null;

export function getLegacyProjectRedirect(slug: string): string | null {
  return LEGACY_PROJECT_REDIRECTS[toSlug(slug)] || null;
}

export async function getProjectDataSafe(slug: string): Promise<ProjectDetailQueryLikeResult> {
  const relativePath = `${slug}.md`;

  try {
    const result = await client.request(
      {
        query: PROJECT_LIVE_QUERY,
        variables: { relativePath },
      },
      {},
    );

    const record = result && typeof result === "object" ? (result as Record<string, unknown>) : {};

    return {
      data: normalizeProjectQueryData(record.data, relativePath),
      query: PROJECT_LIVE_QUERY,
      variables: { relativePath },
    };
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "content", "projects", relativePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);

      return {
        data: normalizeProjectQueryData(
          {
            project: {
              ...(parsed.data as Record<string, unknown>),
              _sys: {
                filename: relativePath,
                basename: relativePath.replace(/\.md$/i, ""),
                relativePath: `projects/${relativePath}`,
              },
            },
          },
          relativePath,
        ),
        query: "",
        variables: {},
      };
    } catch {
      if (!isMissingProjectError(error, relativePath)) {
        console.error(`Unable to load project "${slug}" from Tina or local file.`, error);
      }

      return {
        data: { project: null },
        query: "",
        variables: {},
      };
    }
  }
}

export async function getProjectIndexSafe(): Promise<Array<{ slug: string }>> {
  if (projectIndexCache) return projectIndexCache;

  try {
    const projectDir = path.join(process.cwd(), "content", "projects");
    const files = (await fs.readdir(projectDir)).filter((file) => file.endsWith(".md"));

    projectIndexCache = files
      .map((filename) => ({ slug: toSlug(filename) }))
      .sort((left, right) => left.slug.localeCompare(right.slug));

    return projectIndexCache;
  } catch (error) {
    console.error("Unable to read project index from local files.", error);
    return [];
  }
}
