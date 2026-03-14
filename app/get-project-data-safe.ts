import {
  asRecord,
  createStaticQueryResult,
  listMarkdownFiles,
  readMarkdownFrontmatter,
  withContentSysFields,
} from "@/app/lib/content";
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

    const record = asRecord(result) || {};

    return {
      data: normalizeProjectQueryData(record.data, relativePath),
      query: PROJECT_LIVE_QUERY,
      variables: { relativePath },
    };
  } catch (error) {
    try {
      const frontmatter = await readMarkdownFrontmatter("projects", relativePath);
      return createStaticQueryResult(
        normalizeProjectQueryData(
          {
            project: withContentSysFields("projects", relativePath, frontmatter),
          },
          relativePath,
        ),
      );
    } catch {
      if (!isMissingProjectError(error, relativePath)) {
        console.error(`Unable to load project "${slug}" from Tina or local file.`, error);
      }

      return createStaticQueryResult({ project: null });
    }
  }
}

export async function getProjectIndexSafe(): Promise<Array<{ slug: string }>> {
  if (projectIndexCache) return projectIndexCache;

  try {
    const files = await listMarkdownFiles("projects");
    projectIndexCache = files
      .map((filename) => ({ slug: toSlug(filename) }))
      .sort((left, right) => left.slug.localeCompare(right.slug));

    return projectIndexCache;
  } catch (error) {
    console.error("Unable to read project index from local files.", error);
    return [];
  }
}
