export interface BlockRecord {
  __typename?: string | null;
  [key: string]: unknown;
}

export function asBlockArray(value: unknown): BlockRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BlockRecord => Boolean(item) && typeof item === "object");
}

export function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
