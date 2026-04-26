type ReferenceDirectory = "projects" | "cabinets" | "countertops" | "flooring";

export const TINA_FOCUS_LIST_ITEM_MESSAGE = "cp:tina-focus-list-item";
export const TINA_SIDEBAR_LIST_ROW_KEY_ATTRIBUTE = "data-cp-tina-list-key";
export const TINA_SIDEBAR_LIST_ROW_ITEM_ATTRIBUTE = "data-cp-tina-list-item-id";
export const TINA_CUSTOM_FOCUSABLE_PREVIEW_CLASS_NAME =
  "outline outline-2 outline-dashed outline-[rgba(34,150,254,0.45)] transition-[outline-color,box-shadow] duration-150 hover:outline-[rgba(34,150,254,1)] hover:shadow-[inset_0_0_0_9999px_rgba(34,150,254,0.28)]";

export const TINA_LIST_KEY_CABINET_RELATED_PROJECTS = "cabinet.relatedProjects";
export const TINA_LIST_KEY_CABINET_RELATED_PRODUCTS = "cabinet.relatedProducts";
export const TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS = "countertop.relatedProjects";
export const TINA_LIST_KEY_COUNTERTOP_RELATED_PRODUCTS = "countertop.relatedProducts";
export const TINA_LIST_KEY_FLOORING_RELATED_PROJECTS = "flooring.relatedProjects";
export const TINA_LIST_KEY_FLOORING_RELATED_PRODUCTS = "flooring.relatedProducts";
export const TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS = "project.cabinetProducts";
export const TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS = "project.countertopProducts";
export const TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS = "project.flooringProducts";
export const TINA_LIST_KEY_PROJECT_RELATED_PROJECTS = "project.relatedProjects";

const TINA_LIST_FOCUS_RETRY_DELAYS_MS = [0, 120, 260, 480, 760, 1120];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function collectionNameFromDirectory(directory: ReferenceDirectory): string {
  return directory.endsWith("s") ? directory.slice(0, -1) : directory;
}

function normalizeReferenceString(value: string, directory: ReferenceDirectory): string {
  const trimmed = value.trim().replace(/^\/+/, "");
  if (!trimmed) return "";

  const collectionName = collectionNameFromDirectory(directory);
  const nodeIdMatch = trimmed.match(/^([a-z0-9_-]+):(.*)$/i);
  if (nodeIdMatch) {
    const [, collection, relativePath] = nodeIdMatch;
    const cleanedRelativePath = relativePath.trim().replace(/^\/+/, "");

    if (cleanedRelativePath && (collection === collectionName || collection === directory)) {
      return normalizeReferenceString(cleanedRelativePath, directory);
    }
  }

  if (trimmed.startsWith(`content/${directory}/`)) {
    return trimmed;
  }

  if (trimmed.startsWith(`${directory}/`)) {
    return `content/${trimmed}`;
  }

  const lastSegment = trimmed.split("/").pop() || trimmed;
  const filename = lastSegment.endsWith(".md") ? lastSegment : `${lastSegment.replace(/\.md$/i, "")}.md`;
  return `content/${directory}/${filename}`;
}

function normalizeReferenceValue(value: unknown, directory: ReferenceDirectory): string | undefined {
  const direct = trimString(value);
  if (direct) {
    return normalizeReferenceString(direct, directory);
  }

  const record = asRecord(value);
  if (!record) return undefined;

  const slug = trimString(record.slug);
  if (slug) {
    return normalizeReferenceString(slug, directory);
  }

  const sys = asRecord(record._sys);
  const relativePath = trimString(sys?.relativePath);
  if (relativePath) {
    return normalizeReferenceString(relativePath, directory);
  }

  const filename = trimString(sys?.filename);
  if (filename) {
    return normalizeReferenceString(filename, directory);
  }

  return undefined;
}

function encodeListItemId(value?: string): string | undefined {
  return value ? encodeURIComponent(value) : undefined;
}

function postMessageToTinaParent(message: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.parent || window.parent === window) return;
  window.parent.postMessage(message, "*");
}

export function focusTinaSidebarListItem({
  itemId,
  listKey,
  rootFieldName,
}: {
  itemId?: string;
  listKey: string;
  rootFieldName?: string;
}) {
  if (rootFieldName) {
    postMessageToTinaParent({ type: "field:selected", fieldName: rootFieldName });
  }

  if (!itemId) return;

  TINA_LIST_FOCUS_RETRY_DELAYS_MS.forEach((delay) => {
    window.setTimeout(() => {
      postMessageToTinaParent({
        type: TINA_FOCUS_LIST_ITEM_MESSAGE,
        listKey,
        itemId,
      });
    }, delay);
  });
}

export function getProjectReferenceFocusItemId(value: unknown): string | undefined {
  return encodeListItemId(normalizeReferenceValue(value, "projects"));
}

export function getCabinetReferenceFocusItemId(value: unknown): string | undefined {
  return encodeListItemId(normalizeReferenceValue(value, "cabinets"));
}

export function getCountertopReferenceFocusItemId(value: unknown): string | undefined {
  return encodeListItemId(normalizeReferenceValue(value, "countertops"));
}

export function getFlooringReferenceFocusItemId(value: unknown): string | undefined {
  return encodeListItemId(normalizeReferenceValue(value, "flooring"));
}

/**
 * Derives a focus item ID for a project material list item. Prefers the linked product's
 * normalized reference path; falls back to a synthetic `custom:<name>` ID for customName-only
 * items, then `type:<value>` for type-only items, so all three card variants can be
 * scrolled-to/highlighted in the Tina sidebar. The preview card and the sidebar row compute
 * this the same way so the postMessage payload matches.
 */
function customNameFocusItemId(customName: unknown): string | undefined {
  if (typeof customName !== "string") return undefined;
  const trimmed = customName.trim();
  if (!trimmed) return undefined;
  return `custom:${encodeURIComponent(trimmed)}`;
}

function typeFocusItemId(typeValue: unknown): string | undefined {
  if (typeof typeValue !== "string") return undefined;
  const trimmed = typeValue.trim();
  if (!trimmed) return undefined;
  return `type:${encodeURIComponent(trimmed)}`;
}

export function getCabinetProductFocusItemId(item: { cabinet?: unknown; customName?: unknown; type?: unknown } | null | undefined): string | undefined {
  if (!item) return undefined;
  return (
    getCabinetReferenceFocusItemId(item.cabinet) ||
    customNameFocusItemId(item.customName) ||
    typeFocusItemId(item.type)
  );
}

export function getCountertopProductFocusItemId(item: { countertop?: unknown; customName?: unknown; type?: unknown } | null | undefined): string | undefined {
  if (!item) return undefined;
  return (
    getCountertopReferenceFocusItemId(item.countertop) ||
    customNameFocusItemId(item.customName) ||
    typeFocusItemId(item.type)
  );
}

export function getFlooringProductFocusItemId(item: { flooring?: unknown; customName?: unknown; type?: unknown } | null | undefined): string | undefined {
  if (!item) return undefined;
  return (
    getFlooringReferenceFocusItemId(item.flooring) ||
    customNameFocusItemId(item.customName) ||
    typeFocusItemId(item.type)
  );
}
