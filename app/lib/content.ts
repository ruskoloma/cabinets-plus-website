import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type ContentRecord = Record<string, unknown>;

const CONTENT_ROOT = path.join(process.cwd(), "content");
const MARKDOWN_EXTENSION_PATTERN = /\.md$/i;

export function asRecord(value: unknown): ContentRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as ContentRecord;
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function contentPath(...segments: string[]): string {
  return path.join(CONTENT_ROOT, ...segments);
}

export async function readJsonContentFile<T = unknown>(...segments: string[]): Promise<T> {
  const raw = await fs.readFile(contentPath(...segments), "utf8");
  return JSON.parse(raw) as T;
}

export async function readMarkdownFrontmatter(...segments: string[]): Promise<ContentRecord> {
  const raw = await fs.readFile(contentPath(...segments), "utf8");
  return (matter(raw).data as ContentRecord) || {};
}

export async function listMarkdownFiles(...segments: string[]): Promise<string[]> {
  const files = await fs.readdir(contentPath(...segments));
  return files.filter((file) => MARKDOWN_EXTENSION_PATTERN.test(file));
}

export function withContentSysFields(
  collection: string,
  filename: string,
  data: ContentRecord,
): ContentRecord {
  return {
    ...data,
    _sys: {
      filename,
      basename: filename.replace(MARKDOWN_EXTENSION_PATTERN, ""),
      relativePath: `${collection}/${filename}`,
    },
  };
}

export function createStaticQueryResult<T>(data: T) {
  return {
    data,
    query: "",
    variables: {} as Record<string, unknown>,
  };
}

export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
