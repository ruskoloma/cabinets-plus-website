import { readMarkdownFrontmatter } from "@/app/lib/content";

export interface ResolvedProjectsSectionItem {
  href: string;
  image: string;
  title: string;
  imageOverride: string;
  projectFilename: string;
}

function extractReferenceFilename(ref: unknown): string | null {
  if (typeof ref === "string" && ref.length > 0) {
    const name = ref.split("/").pop();
    return name ? name.replace(/\.md$/, "") : null;
  }

  if (ref && typeof ref === "object") {
    const record = ref as Record<string, unknown>;
    const sys = record._sys as Record<string, unknown> | undefined;
    const filename = typeof sys?.filename === "string" ? sys.filename : null;
    if (filename) return filename.replace(/\.md$/, "");
    const relativePath = typeof sys?.relativePath === "string" ? sys.relativePath : null;
    if (relativePath) {
      const name = relativePath.split("/").pop();
      return name ? name.replace(/\.md$/, "") : null;
    }
    const id = typeof record.id === "string" ? record.id : null;
    if (id) {
      const name = id.split("/").pop();
      return name ? name.replace(/\.md$/, "") : null;
    }
  }

  return null;
}

async function resolveReferencedProject(
  ref: unknown,
): Promise<{ title: string; image: string; href: string; filename: string } | null> {
  const filename = extractReferenceFilename(ref);
  if (!filename) return null;

  try {
    const data = await readMarkdownFrontmatter("projects", `${filename}.md`);
    const mediaList = Array.isArray(data.media) ? data.media : [];
    const firstMedia = mediaList[0];
    const file =
      firstMedia && typeof firstMedia === "object" && typeof (firstMedia as Record<string, unknown>).file === "string"
        ? ((firstMedia as Record<string, unknown>).file as string)
        : "";

    return {
      title: typeof data.title === "string" && data.title.length > 0 ? data.title : filename,
      image: file,
      href: `/projects/${filename}`,
      filename,
    };
  } catch {
    return null;
  }
}

function isProjectsSectionBlock(block: Record<string, unknown>): boolean {
  if (block._template === "projectsSection") return true;
  const typename = typeof block.__typename === "string" ? block.__typename : "";
  return typename.endsWith("ProjectsSection");
}

async function enrichBlock(block: Record<string, unknown>): Promise<void> {
  const rawProjects = Array.isArray(block.projects) ? (block.projects as unknown[]) : [];
  const resolved: ResolvedProjectsSectionItem[] = [];

  for (const rawItem of rawProjects) {
    if (!rawItem || typeof rawItem !== "object") continue;
    const item = rawItem as Record<string, unknown>;
    const project = await resolveReferencedProject(item.project);
    if (!project) continue;

    const override = typeof item.imageOverride === "string" ? item.imageOverride : "";

    resolved.push({
      title: project.title,
      href: project.href,
      image: override.length > 0 ? override : project.image,
      imageOverride: override,
      projectFilename: project.filename,
    });
  }

  block.resolvedProjects = resolved;
}

export async function enrichProjectsSectionBlocks(blocks: unknown): Promise<void> {
  if (!Array.isArray(blocks)) return;

  await Promise.all(
    blocks.map(async (block) => {
      if (!block || typeof block !== "object") return;
      const record = block as Record<string, unknown>;
      if (!isProjectsSectionBlock(record)) return;
      await enrichBlock(record);
    }),
  );
}

export async function enrichProjectsSectionBlocksInPageResult(
  result: { data?: Record<string, unknown> } | null | undefined,
): Promise<void> {
  if (!result || !result.data) return;

  await Promise.all(
    Object.values(result.data).map(async (value) => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      await enrichProjectsSectionBlocks(record.blocks);
    }),
  );
}
