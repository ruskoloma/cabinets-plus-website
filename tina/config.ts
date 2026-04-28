import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import React from "react";
import { defineConfig, ImageField } from "tinacms";
import { IMAGE_SIZE_SELECT_OPTIONS } from "../lib/image-size-controls";
import {
  getCabinetProductFocusItemId,
  getCabinetReferenceFocusItemId,
  getCountertopProductFocusItemId,
  getCountertopReferenceFocusItemId,
  getFlooringProductFocusItemId,
  getFlooringReferenceFocusItemId,
  getProjectReferenceFocusItemId,
  TINA_FOCUS_LIST_ITEM_MESSAGE,
  TINA_LIST_KEY_CABINET_RELATED_PRODUCTS,
  TINA_LIST_KEY_CABINET_RELATED_PROJECTS,
  TINA_LIST_KEY_COLLECTION_RELATED_PROJECTS,
  TINA_LIST_KEY_COUNTERTOP_RELATED_PRODUCTS,
  TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS,
  TINA_LIST_KEY_FLOORING_RELATED_PRODUCTS,
  TINA_LIST_KEY_FLOORING_RELATED_PROJECTS,
  TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
  TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
  TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS,
  TINA_LIST_KEY_PROJECT_RELATED_PROJECTS,
  TINA_SIDEBAR_LIST_ROW_ITEM_ATTRIBUTE,
  TINA_SIDEBAR_LIST_ROW_KEY_ATTRIBUTE,
} from "../lib/tina-list-focus";
import { getImageVariantUrl } from "../lib/image-variants";
import { HOMEPAGE_SECTION_IMAGE_SIZE_OPTIONS } from "../lib/homepage-image-controls";
import {
  getTinaSidebarMediaItemId,
  TINA_FOCUS_PROJECT_MEDIA_MESSAGE,
} from "../lib/tina-media-focus";
import { cabinetReferenceLabelsByValue } from "./cabinet-reference-options";
import { seoFields } from "./seo-fields";
import catalogSettingsData from "../content/global/catalog-settings.json";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const defaultPaintOptions = [
  "white",
  "off white",
  "timber",
  "gray",
  "brown",
  "blue",
  "green",
  "black",
  "custom paint",
];

const defaultCabinetStainTypes = ["white glaze stain", "mocha stain"];
const defaultDoorStyles = ["shaker", "slim shaker", "elegant shaker", "flat panel"];
const defaultRooms = ["Kitchen", "Bathroom", "Laundry", "Other"];
const defaultCountertopTypes = ["Quartz", "Granite", "Marble", "Quartzite", "Soapstone", "Porcelain", "Butcher Block", "Other"];
const defaultFlooringTypes = ["LVP", "Laminate", "Carpet", "Hardwood"];

function extractCatalogOptionValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (!entry || typeof entry !== "object") return "";

      const record = entry as Record<string, unknown>;
      const fromValue = typeof record.value === "string" ? record.value.trim() : "";
      if (fromValue) return fromValue;

      const fromLabel = typeof record.label === "string" ? record.label.trim() : "";
      return fromLabel;
    })
    .filter(Boolean);
}

function readCatalogSettingsOptions() {
  const parsed = catalogSettingsData as {
    stainTypes?: unknown;
    doorStyles?: unknown;
    rooms?: unknown;
    paintOptions?: unknown;
    countertopTypes?: unknown;
    flooringTypes?: unknown;
  };
  const stainTypes = extractCatalogOptionValues(parsed.stainTypes);
  const doorStyles = extractCatalogOptionValues(parsed.doorStyles);
  const rooms = Array.isArray(parsed.rooms)
    ? parsed.rooms.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const paintOptions = extractCatalogOptionValues(parsed.paintOptions);
  const countertopTypes = extractCatalogOptionValues(parsed.countertopTypes);
  const flooringTypes = extractCatalogOptionValues(parsed.flooringTypes);
  return {
    stainTypes: stainTypes.length ? stainTypes : defaultCabinetStainTypes,
    doorStyles: doorStyles.length ? doorStyles : defaultDoorStyles,
    rooms: rooms.length ? rooms : defaultRooms,
    paintOptions: paintOptions.length ? paintOptions : defaultPaintOptions,
    countertopTypes: countertopTypes.length ? countertopTypes : defaultCountertopTypes,
    flooringTypes: flooringTypes.length ? flooringTypes : defaultFlooringTypes,
  };
}

const catalogSettingsOptions = readCatalogSettingsOptions();

function resolveCabinetReferenceLabel(value: unknown) {
  const normalized = normalizeReferenceValue(String(value || ""), "cabinets");
  if (!normalized) return "Select cabinet door";

  const file = normalized.split("/").pop() || normalized;
  const slug = file.replace(/\.md$/, "");
  const normalizedWithExt = file.endsWith(".md") ? file : `${file}.md`;

  return (
    cabinetReferenceLabelsByValue[normalized] ||
    cabinetReferenceLabelsByValue[`content/cabinets/${normalizedWithExt}`] ||
    cabinetReferenceLabelsByValue[normalizedWithExt] ||
    cabinetReferenceLabelsByValue[`content/cabinets/${slug}.md`] ||
    slug
  );
}

function resolveCabinetDocumentReferenceLabel(value: unknown) {
  const record = asRecord(value);
  if (record) {
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const code = typeof record.code === "string" ? record.code.trim().replace(/^#+/, "") : "";
    const sys = asRecord(record._sys);
    const fallback = resolveCabinetReferenceLabel(
      typeof record.slug === "string" && record.slug.trim()
        ? `content/cabinets/${record.slug.trim()}.md`
        : typeof sys?.relativePath === "string"
          ? sys.relativePath
          : typeof sys?.filename === "string"
            ? `content/cabinets/${sys.filename}`
            : "",
    );

    if (code && name) return `${code} - ${name}`;
    return name || fallback;
  }

  return resolveCabinetReferenceLabel(value);
}

function resolveCountertopReferenceLabel(value: unknown) {
  const normalized = normalizeReferenceValue(String(value || ""), "countertops");
  if (!normalized) return "Select countertop";

  const file = normalized.split("/").pop() || normalized;
  const slug = file.replace(/\.md$/i, "");
  return humanizeSlug(slug);
}

function resolveCountertopDocumentReferenceLabel(value: unknown) {
  const record = asRecord(value);
  if (record) {
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const code = typeof record.code === "string" ? record.code.trim().replace(/^#+/, "") : "";
    const sys = asRecord(record._sys);
    const fallback = resolveCountertopReferenceLabel(
      typeof record.slug === "string" && record.slug.trim()
        ? `content/countertops/${record.slug.trim()}.md`
        : typeof sys?.relativePath === "string"
          ? sys.relativePath
          : typeof sys?.filename === "string"
            ? `content/countertops/${sys.filename}`
            : "",
    );

    if (code && name) return `${code} - ${name}`;
    return name || fallback;
  }

  return resolveCountertopReferenceLabel(value);
}

function resolveFlooringReferenceLabel(value: unknown) {
  const normalized = normalizeReferenceValue(String(value || ""), "flooring");
  if (!normalized) return "Select flooring";

  const file = normalized.split("/").pop() || normalized;
  const slug = file.replace(/\.md$/i, "");
  return humanizeSlug(slug);
}

function resolveFlooringDocumentReferenceLabel(value: unknown) {
  const record = asRecord(value);
  if (record) {
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const code = typeof record.code === "string" ? record.code.trim().replace(/^#+/, "") : "";
    const sys = asRecord(record._sys);
    const fallback = resolveFlooringReferenceLabel(
      typeof record.slug === "string" && record.slug.trim()
        ? `content/flooring/${record.slug.trim()}.md`
        : typeof sys?.relativePath === "string"
          ? sys.relativePath
          : typeof sys?.filename === "string"
            ? `content/flooring/${sys.filename}`
            : "",
    );

    if (code && name) return `${code} - ${name}`;
    return name || fallback;
  }

  return resolveFlooringReferenceLabel(value);
}

function resolveProjectReferenceLabel(value: unknown) {
  const normalized = normalizeReferenceValue(String(value || ""), "projects");
  if (!normalized) return "Select project";

  const file = normalized.split("/").pop() || normalized;
  const slug = file.replace(/\.md$/, "");

  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function humanizeSlug(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readPostReferenceOptions() {
  try {
    const postsDir = path.join(process.cwd(), "content", "posts");
    const entries = fs
      .readdirSync(postsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => {
        const fullPath = path.join(postsDir, entry.name);
        const raw = fs.readFileSync(fullPath, "utf8");
        const parsed = matter(raw);
        const slug = entry.name.replace(/\.md$/i, "");
        const title = typeof parsed.data.title === "string" ? parsed.data.title.trim() : "";

        return {
          label: title || humanizeSlug(slug),
          value: `content/posts/${entry.name}`,
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    const labelsByValue = Object.fromEntries(entries.map((entry) => [entry.value, entry.label]));

    return {
      options: entries,
      labelsByValue,
    };
  } catch {
    return {
      options: [] as Array<{ label: string; value: string }>,
      labelsByValue: {} as Record<string, string>,
    };
  }
}

function collectionNameFromDirectory(directory: string) {
  return directory.endsWith("s") ? directory.slice(0, -1) : directory;
}

function normalizeReferenceFilePath(value: string, directory: string) {
  const trimmed = value.trim().replace(/^\/+/, "");
  if (!trimmed) return "";

  const collectionName = collectionNameFromDirectory(directory);
  const nodeIdMatch = trimmed.match(/^([a-z0-9_-]+):(.*)$/i);
  if (nodeIdMatch) {
    const [, collection, relativePath] = nodeIdMatch;
    const cleanedRelativePath = relativePath.trim().replace(/^\/+/, "");

    if (cleanedRelativePath && (collection === collectionName || collection === directory)) {
      if (cleanedRelativePath.startsWith(`content/${directory}/`)) return cleanedRelativePath;
      if (cleanedRelativePath.startsWith(`${directory}/`)) return `content/${cleanedRelativePath}`;
      return `content/${directory}/${cleanedRelativePath}`;
    }
  }

  return trimmed;
}

function getReferenceMediaFallback(value: unknown) {
  if (!Array.isArray(value)) return "";

  const items = value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));

  const primaryItem = items.find((entry) => entry.isPrimary === true);
  const primaryFile = typeof primaryItem?.file === "string" ? primaryItem.file.trim() : "";
  if (primaryFile) return primaryFile;

  const firstFile = items
    .map((entry) => (typeof entry.file === "string" ? entry.file.trim() : ""))
    .find(Boolean);

  return firstFile || "";
}

function normalizeReferenceValue(value: string, directory: string) {
  const trimmed = normalizeReferenceFilePath(value, directory).replace(/^\/+/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith(`content/${directory}/`)) return trimmed;
  if (trimmed.startsWith(`${directory}/`)) return `content/${trimmed}`;
  if (trimmed.startsWith("content/")) return trimmed;
  const filename = trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`;
  return `content/${directory}/${filename.split("/").pop() || filename}`;
}

const { options: postReferenceSelectOptions, labelsByValue: postReferenceLabelsByValue } = readPostReferenceOptions();

function resolvePostReferenceLabel(value: unknown) {
  const ref = String(value || "").trim();
  if (!ref) return "Select article";

  const cleaned = ref.replace(/^\/+/, "");
  const file = cleaned.split("/").pop() || cleaned;
  const slug = file.replace(/\.md$/i, "");
  const normalizedWithExt = file.endsWith(".md") ? file : `${file}.md`;

  return (
    postReferenceLabelsByValue[cleaned] ||
    postReferenceLabelsByValue[`content/${cleaned}`] ||
    postReferenceLabelsByValue[`content/posts/${normalizedWithExt}`] ||
    postReferenceLabelsByValue[normalizedWithExt] ||
    humanizeSlug(slug)
  );
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readProjectReferenceData(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const record = asRecord(values);
  const fallbackImage = getReferenceMediaFallback(record?.media);

  return {
    title: typeof record?.title === "string" ? record.title.trim() : "",
    slug: typeof record?.slug === "string" ? record.slug.trim() : "",
    previewImage: fallbackImage,
    filename: internalSys?.filename?.trim() || "",
    path: internalSys?.path?.trim() || "",
  };
}

function readCabinetReferenceData(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const record = asRecord(values);
  const picture = typeof record?.picture === "string" ? record.picture.trim() : "";
  const fallbackImage = getReferenceMediaFallback(record?.media);

  return {
    name: typeof record?.name === "string" ? record.name.trim() : "",
    code: typeof record?.code === "string" ? record.code.trim().replace(/^#+/, "") : "",
    slug: typeof record?.slug === "string" ? record.slug.trim() : "",
    picture: picture || fallbackImage,
    filename: internalSys?.filename?.trim() || "",
    path: internalSys?.path?.trim() || "",
  };
}

function readCountertopReferenceData(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const record = asRecord(values);
  const picture = typeof record?.picture === "string" ? record.picture.trim() : "";
  const fallbackImage = getReferenceMediaFallback(record?.media);

  return {
    name: typeof record?.name === "string" ? record.name.trim() : "",
    code: typeof record?.code === "string" ? record.code.trim().replace(/^#+/, "") : "",
    slug: typeof record?.slug === "string" ? record.slug.trim() : "",
    picture: picture || fallbackImage,
    filename: internalSys?.filename?.trim() || "",
    path: internalSys?.path?.trim() || "",
  };
}

function readFlooringReferenceData(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const record = asRecord(values);
  const picture = typeof record?.picture === "string" ? record.picture.trim() : "";
  const fallbackImage = getReferenceMediaFallback(record?.media);

  return {
    name: typeof record?.name === "string" ? record.name.trim() : "",
    code: typeof record?.code === "string" ? record.code.trim().replace(/^#+/, "") : "",
    slug: typeof record?.slug === "string" ? record.slug.trim() : "",
    picture: picture || fallbackImage,
    filename: internalSys?.filename?.trim() || "",
    path: internalSys?.path?.trim() || "",
  };
}

function renderProjectReferenceOption(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const project = readProjectReferenceData(values, internalSys);
  const title = project.title || resolveProjectReferenceLabel(project.slug || project.filename || project.path);
  const meta = project.slug || project.filename || "";

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        minWidth: 0,
        padding: "6px 0",
      },
    },
    project.previewImage
      ? React.createElement("img", {
          src: project.previewImage,
          alt: title,
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            objectFit: "cover",
            backgroundColor: "#f9fafb",
            display: "block",
          },
        })
      : React.createElement("div", {
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          },
        }),
    React.createElement(
      "div",
      { style: { minWidth: 0, flex: 1 } },
      React.createElement("div", { style: { fontSize: "14px", lineHeight: 1.3, fontWeight: 600, color: "#111827" } }, title),
      meta
        ? React.createElement("div", { style: { marginTop: "4px", fontSize: "12px", lineHeight: 1.3, color: "#6b7280" } }, meta)
        : null,
    ),
  );
}

function renderCabinetReferenceOption(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const cabinet = readCabinetReferenceData(values, internalSys);
  const title =
    cabinet.code && cabinet.name
      ? `${cabinet.code} - ${cabinet.name}`
      : cabinet.name || resolveCabinetReferenceLabel(cabinet.filename || cabinet.path);
  const meta = cabinet.slug || cabinet.filename || "";

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        minWidth: 0,
        padding: "6px 0",
      },
    },
    cabinet.picture
      ? React.createElement("img", {
          src: cabinet.picture,
          alt: title,
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            objectFit: "cover",
            backgroundColor: "#f9fafb",
            display: "block",
          },
        })
      : React.createElement("div", {
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          },
        }),
    React.createElement(
      "div",
      { style: { minWidth: 0, flex: 1 } },
      React.createElement("div", { style: { fontSize: "14px", lineHeight: 1.3, fontWeight: 600, color: "#111827" } }, title),
      meta
        ? React.createElement("div", { style: { marginTop: "4px", fontSize: "12px", lineHeight: 1.3, color: "#6b7280" } }, meta)
        : null,
    ),
  );
}

function renderCountertopReferenceOption(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const countertop = readCountertopReferenceData(values, internalSys);
  const title =
    countertop.code && countertop.name
      ? `${countertop.code} - ${countertop.name}`
      : countertop.name || resolveCountertopReferenceLabel(countertop.filename || countertop.path);
  const meta = countertop.slug || countertop.filename || "";

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        minWidth: 0,
        padding: "6px 0",
      },
    },
    countertop.picture
      ? React.createElement("img", {
          src: countertop.picture,
          alt: title,
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            objectFit: "cover",
            backgroundColor: "#f9fafb",
            display: "block",
          },
        })
      : React.createElement("div", {
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          },
        }),
    React.createElement(
      "div",
      { style: { minWidth: 0, flex: 1 } },
      React.createElement("div", { style: { fontSize: "14px", lineHeight: 1.3, fontWeight: 600, color: "#111827" } }, title),
      meta
        ? React.createElement("div", { style: { marginTop: "4px", fontSize: "12px", lineHeight: 1.3, color: "#6b7280" } }, meta)
        : null,
    ),
  );
}

function renderFlooringReferenceOption(
  values: unknown,
  internalSys?: { filename?: string; path?: string },
) {
  const flooring = readFlooringReferenceData(values, internalSys);
  const title =
    flooring.code && flooring.name
      ? `${flooring.code} - ${flooring.name}`
      : flooring.name || resolveFlooringReferenceLabel(flooring.filename || flooring.path);
  const meta = flooring.slug || flooring.filename || "";

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        minWidth: 0,
        padding: "6px 0",
      },
    },
    flooring.picture
      ? React.createElement("img", {
          src: flooring.picture,
          alt: title,
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            objectFit: "cover",
            backgroundColor: "#f9fafb",
            display: "block",
          },
        })
      : React.createElement("div", {
          style: {
            width: "252px",
            height: "168px",
            flexShrink: 0,
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          },
        }),
    React.createElement(
      "div",
      { style: { minWidth: 0, flex: 1 } },
      React.createElement("div", { style: { fontSize: "14px", lineHeight: 1.3, fontWeight: 600, color: "#111827" } }, title),
      meta
        ? React.createElement("div", { style: { marginTop: "4px", fontSize: "12px", lineHeight: 1.3, color: "#6b7280" } }, meta)
        : null,
    ),
  );
}

type MediaFieldRendererProps = {
  input?: {
    value?: unknown;
  };
  field?: {
    label?: string | boolean;
  };
} & Record<string, unknown>;

const TypedImageField = ImageField as React.ComponentType<Record<string, unknown>>;
const TINA_MEDIA_ITEM_HIGHLIGHT_DURATION_MS = 2200;
const TINA_SIDEBAR_MEDIA_ITEM_ROW_ATTRIBUTE = "data-cp-tina-media-item-row";

function clearTinaMediaItemHighlight(target: HTMLElement) {
  target.style.backgroundColor = "";
  target.style.borderColor = "";
  target.style.boxShadow = "";
}

function applyTinaMediaItemHighlight(target: HTMLElement) {
  target.style.backgroundColor = "#fff7ed";
  target.style.borderColor = "#c25e20";
  target.style.boxShadow = "0 0 0 2px rgba(194, 94, 32, 0.28), 0 12px 30px rgba(194, 94, 32, 0.12)";
}

function clearTinaSidebarListItemHighlight(target: HTMLElement) {
  clearTinaMediaItemHighlight(target);
}

function applyTinaSidebarListItemHighlight(target: HTMLElement) {
  applyTinaMediaItemHighlight(target);
}

function TinaVariantPreviewImage({
  alt,
  fit,
  src,
}: {
  alt: string;
  fit: "contain" | "cover";
  src: string;
}) {
  const preferredSrc = getImageVariantUrl(src, "thumb");
  const [activeSrc, setActiveSrc] = React.useState(preferredSrc);

  React.useEffect(() => {
    setActiveSrc(preferredSrc);
  }, [preferredSrc]);

  return React.createElement("img", {
    src: activeSrc,
    alt,
    onError:
      activeSrc !== src
        ? () => {
            setActiveSrc(src);
          }
        : undefined,
    style: {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: fit,
      borderRadius: "6px",
      backgroundColor: "#f9fafb",
    },
  });
}

function TinaMediaListItemLabel({
  file,
  isVideo,
  name,
}: {
  file: string;
  isVideo: boolean;
  name: string;
}) {
  const itemId = getTinaSidebarMediaItemId(file);
  const focusTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!itemId || typeof window === "undefined") return undefined;

    const handleMessage = (event: MessageEvent) => {
      const payload = event.data && typeof event.data === "object" ? (event.data as Record<string, unknown>) : null;
      if (!payload || payload.type !== TINA_FOCUS_PROJECT_MEDIA_MESSAGE || payload.itemId !== itemId) {
        return;
      }

      const target = window.document.querySelector<HTMLElement>(`[${TINA_SIDEBAR_MEDIA_ITEM_ROW_ATTRIBUTE}="${itemId}"]`);
      if (!target) return;

      target.ownerDocument
        .querySelectorAll<HTMLElement>(`[${TINA_SIDEBAR_MEDIA_ITEM_ROW_ATTRIBUTE}]`)
        .forEach((row) => {
          if (row !== target) {
            clearTinaMediaItemHighlight(row);
          }
        });

      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      applyTinaMediaItemHighlight(target);

      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }

      focusTimeoutRef.current = window.setTimeout(() => {
        clearTinaMediaItemHighlight(target);
        focusTimeoutRef.current = null;
      }, TINA_MEDIA_ITEM_HIGHLIGHT_DURATION_MS);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [itemId]);

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minWidth: 0,
        width: "100%",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          width: "180px",
          height: "120px",
          flexShrink: 0,
          borderRadius: "6px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      isVideo
        ? React.createElement(
            "span",
            {
              style: {
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b7280",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              },
            },
            "Video",
          )
        : React.createElement(TinaVariantPreviewImage, {
            src: file,
            alt: name,
            fit: "cover",
          }),
    ),
    React.createElement(
      "div",
      {
        style: {
          minWidth: 0,
          flex: 1,
        },
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: "14px",
            lineHeight: 1.3,
            fontWeight: 600,
            color: "#374151",
            wordBreak: "break-word",
          },
        },
        isVideo ? `Video: ${name}` : name,
      ),
    ),
  );
}

function TinaFocusableListItemLabel({
  itemId,
  label,
  listKey,
}: {
  itemId?: string;
  label: string;
  listKey: string;
}) {
  const focusTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!itemId || typeof window === "undefined") return undefined;

    const handleMessage = (event: MessageEvent) => {
      const payload = event.data && typeof event.data === "object" ? (event.data as Record<string, unknown>) : null;
      if (!payload || payload.type !== TINA_FOCUS_LIST_ITEM_MESSAGE) return;
      if (payload.listKey !== listKey || payload.itemId !== itemId) return;

      const target = window.document.querySelector<HTMLElement>(
        `[${TINA_SIDEBAR_LIST_ROW_KEY_ATTRIBUTE}="${listKey}"][${TINA_SIDEBAR_LIST_ROW_ITEM_ATTRIBUTE}="${itemId}"]`,
      );
      if (!target) return;

      target.ownerDocument
        .querySelectorAll<HTMLElement>(`[${TINA_SIDEBAR_LIST_ROW_ITEM_ATTRIBUTE}]`)
        .forEach((row) => {
          if (row !== target) {
            clearTinaSidebarListItemHighlight(row);
          }
        });

      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      applyTinaSidebarListItemHighlight(target);

      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }

      focusTimeoutRef.current = window.setTimeout(() => {
        clearTinaSidebarListItemHighlight(target);
        focusTimeoutRef.current = null;
      }, TINA_MEDIA_ITEM_HIGHLIGHT_DURATION_MS);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [itemId, listKey]);

  return React.createElement("span", null, label);
}

type TinaItemPropsResult = {
  key?: string;
  label?: React.ReactNode;
  style?: React.CSSProperties;
  [key: `data-${string}`]: string | undefined;
};

function buildFocusableTinaItemProps({
  itemId,
  label,
  listKey,
}: {
  itemId?: string;
  label: string;
  listKey: string;
}): TinaItemPropsResult {
  return {
    label: React.createElement(TinaFocusableListItemLabel, {
      itemId,
      label,
      listKey,
    }),
    ...(itemId
      ? {
          [TINA_SIDEBAR_LIST_ROW_KEY_ATTRIBUTE]: listKey,
          [TINA_SIDEBAR_LIST_ROW_ITEM_ATTRIBUTE]: itemId,
        }
      : {}),
    style: {
      transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
      ...(itemId ? { borderRadius: "8px" } : {}),
    },
  };
}

function createFocusableObjectListItemProps<Item>(
  listKey: string,
  getLabel: (item?: Item) => string,
  getItemId: (item?: Item) => string | undefined,
) {
  return ((item: object) =>
    buildFocusableTinaItemProps({
      listKey,
      label: getLabel(item as Item),
      itemId: getItemId(item as Item),
    })) as unknown as (item: object) => {
    key?: string;
    label?: string;
  };
}

const cabinetRelatedProjectsItemProps = createFocusableObjectListItemProps<{ project?: unknown }>(
  TINA_LIST_KEY_CABINET_RELATED_PROJECTS,
  (item) => resolveProjectReferenceLabel(item?.project),
  (item) => getProjectReferenceFocusItemId(item?.project),
);

const cabinetRelatedProductsItemProps = createFocusableObjectListItemProps<{ product?: unknown }>(
  TINA_LIST_KEY_CABINET_RELATED_PRODUCTS,
  (item) => resolveCabinetDocumentReferenceLabel(item?.product),
  (item) => getCabinetReferenceFocusItemId(item?.product),
);

const countertopRelatedProjectsItemProps = createFocusableObjectListItemProps<{ project?: unknown }>(
  TINA_LIST_KEY_COUNTERTOP_RELATED_PROJECTS,
  (item) => resolveProjectReferenceLabel(item?.project),
  (item) => getProjectReferenceFocusItemId(item?.project),
);

const countertopRelatedProductsItemProps = createFocusableObjectListItemProps<{ product?: unknown }>(
  TINA_LIST_KEY_COUNTERTOP_RELATED_PRODUCTS,
  (item) => resolveCountertopDocumentReferenceLabel(item?.product),
  (item) => getCountertopReferenceFocusItemId(item?.product),
);

const flooringRelatedProjectsItemProps = createFocusableObjectListItemProps<{ project?: unknown }>(
  TINA_LIST_KEY_FLOORING_RELATED_PROJECTS,
  (item) => resolveProjectReferenceLabel(item?.project),
  (item) => getProjectReferenceFocusItemId(item?.project),
);

const flooringRelatedProductsItemProps = createFocusableObjectListItemProps<{ product?: unknown }>(
  TINA_LIST_KEY_FLOORING_RELATED_PRODUCTS,
  (item) => resolveFlooringDocumentReferenceLabel(item?.product),
  (item) => getFlooringReferenceFocusItemId(item?.product),
);

function resolveCustomOrProductLabel(
  referenceValue: unknown,
  customName: unknown,
  resolveReferenceLabel: (value: unknown) => string,
  typeValue?: unknown,
): string {
  if (referenceValue) return resolveReferenceLabel(referenceValue);
  if (typeof customName === "string" && customName.trim()) return customName.trim();
  if (typeof typeValue === "string" && typeValue.trim()) return typeValue.trim();
  return resolveReferenceLabel(referenceValue);
}

const projectCabinetProductsItemProps = createFocusableObjectListItemProps<{ cabinet?: unknown; customName?: unknown; type?: unknown }>(
  TINA_LIST_KEY_PROJECT_CABINET_PRODUCTS,
  (item) => resolveCustomOrProductLabel(item?.cabinet, item?.customName, resolveCabinetDocumentReferenceLabel, item?.type),
  (item) => getCabinetProductFocusItemId(item),
);

const projectCountertopProductsItemProps = createFocusableObjectListItemProps<{ countertop?: unknown; customName?: unknown; type?: unknown }>(
  TINA_LIST_KEY_PROJECT_COUNTERTOP_PRODUCTS,
  (item) => resolveCustomOrProductLabel(item?.countertop, item?.customName, resolveCountertopDocumentReferenceLabel, item?.type),
  (item) => getCountertopProductFocusItemId(item),
);

const projectFlooringProductsItemProps = createFocusableObjectListItemProps<{ flooring?: unknown; customName?: unknown; type?: unknown }>(
  TINA_LIST_KEY_PROJECT_FLOORING_PRODUCTS,
  (item) => resolveCustomOrProductLabel(item?.flooring, item?.customName, resolveFlooringDocumentReferenceLabel, item?.type),
  (item) => getFlooringProductFocusItemId(item),
);

const projectRelatedProjectsItemProps = createFocusableObjectListItemProps<{ project?: unknown }>(
  TINA_LIST_KEY_PROJECT_RELATED_PROJECTS,
  (item) => resolveProjectReferenceLabel(item?.project),
  (item) => getProjectReferenceFocusItemId(item?.project),
);

const collectionRelatedProjectsItemProps = createFocusableObjectListItemProps<{ project?: unknown }>(
  TINA_LIST_KEY_COLLECTION_RELATED_PROJECTS,
  (item) => resolveProjectReferenceLabel(item?.project),
  (item) => getProjectReferenceFocusItemId(item?.project),
);

function renderLargeMediaPreviewField(props: MediaFieldRendererProps) {
  const src = typeof props?.input?.value === "string" ? props.input.value.trim() : "";
  const alt = typeof props?.field?.label === "string" ? props.field.label : "Media preview";

  return React.createElement(
    "div",
    {
      style: {
        display: "grid",
        gap: "12px",
      },
    },
    src
      ? React.createElement(
          "div",
          {
            style: {
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              padding: "10px",
              maxWidth: "560px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: "100%",
                maxWidth: "560px",
                height: "360px",
              },
            },
            React.createElement(TinaVariantPreviewImage, {
              src,
              alt,
              fit: "contain",
            }),
          ),
        )
      : null,
    React.createElement(TypedImageField, props),
  );
}

function filterProjectReferenceOptions(list: Array<unknown>, searchQuery?: string) {
  const query = normalizeSearchText(searchQuery || "");
  if (!query) return list;

  return list
    .map((group) => {
      const groupRecord = asRecord(group);
      const edges = Array.isArray(groupRecord?.edges) ? groupRecord.edges : [];
      const filteredEdges = edges.filter((edge) => {
        const edgeRecord = asRecord(edge);
        const node = asRecord(edgeRecord?.node);
        const internalSys = asRecord(node?._internalSys);
        const project = readProjectReferenceData(node?._values, {
          filename: typeof internalSys?.filename === "string" ? internalSys.filename : undefined,
          path: typeof internalSys?.path === "string" ? internalSys.path : undefined,
        });
        const haystack = normalizeSearchText([
          project.title,
          project.slug,
          project.filename,
          project.path,
        ].join(" "));

        return haystack.includes(query);
      });

      return {
        ...(groupRecord || {}),
        edges: filteredEdges,
      };
    })
    .filter((group) => Array.isArray(group?.edges) && group.edges.length > 0);
}

function filterCabinetReferenceOptions(list: Array<unknown>, searchQuery?: string) {
  const query = normalizeSearchText(searchQuery || "");
  if (!query) return list;

  return list
    .map((group) => {
      const groupRecord = asRecord(group);
      const edges = Array.isArray(groupRecord?.edges) ? groupRecord.edges : [];
      const filteredEdges = edges.filter((edge) => {
        const edgeRecord = asRecord(edge);
        const node = asRecord(edgeRecord?.node);
        const internalSys = asRecord(node?._internalSys);
        const cabinet = readCabinetReferenceData(node?._values, {
          filename: typeof internalSys?.filename === "string" ? internalSys.filename : undefined,
          path: typeof internalSys?.path === "string" ? internalSys.path : undefined,
        });
        const haystack = normalizeSearchText([
          cabinet.code,
          cabinet.name,
          cabinet.slug,
          cabinet.filename,
          cabinet.path,
        ].join(" "));

        return haystack.includes(query);
      });

      return {
        ...(groupRecord || {}),
        edges: filteredEdges,
      };
    })
    .filter((group) => Array.isArray(group?.edges) && group.edges.length > 0);
}

function filterCountertopReferenceOptions(list: Array<unknown>, searchQuery?: string) {
  const query = normalizeSearchText(searchQuery || "");
  if (!query) return list;

  return list
    .map((group) => {
      const groupRecord = asRecord(group);
      const edges = Array.isArray(groupRecord?.edges) ? groupRecord.edges : [];
      const filteredEdges = edges.filter((edge) => {
        const edgeRecord = asRecord(edge);
        const node = asRecord(edgeRecord?.node);
        const internalSys = asRecord(node?._internalSys);
        const countertop = readCountertopReferenceData(node?._values, {
          filename: typeof internalSys?.filename === "string" ? internalSys.filename : undefined,
          path: typeof internalSys?.path === "string" ? internalSys.path : undefined,
        });
        const haystack = normalizeSearchText([
          countertop.code,
          countertop.name,
          countertop.slug,
          countertop.filename,
          countertop.path,
        ].join(" "));

        return haystack.includes(query);
      });

      return {
        ...(groupRecord || {}),
        edges: filteredEdges,
      };
    })
    .filter((group) => Array.isArray(group?.edges) && group.edges.length > 0);
}

function filterFlooringReferenceOptions(list: Array<unknown>, searchQuery?: string) {
  const query = normalizeSearchText(searchQuery || "");
  if (!query) return list;

  return list
    .map((group) => {
      const groupRecord = asRecord(group);
      const edges = Array.isArray(groupRecord?.edges) ? groupRecord.edges : [];
      const filteredEdges = edges.filter((edge) => {
        const edgeRecord = asRecord(edge);
        const node = asRecord(edgeRecord?.node);
        const internalSys = asRecord(node?._internalSys);
        const flooring = readFlooringReferenceData(node?._values, {
          filename: typeof internalSys?.filename === "string" ? internalSys.filename : undefined,
          path: typeof internalSys?.path === "string" ? internalSys.path : undefined,
        });
        const haystack = normalizeSearchText([
          flooring.code,
          flooring.name,
          flooring.slug,
          flooring.filename,
          flooring.path,
        ].join(" "));

        return haystack.includes(query);
      });

      return {
        ...(groupRecord || {}),
        edges: filteredEdges,
      };
    })
    .filter((group) => Array.isArray(group?.edges) && group.edges.length > 0);
}

function resolveDocumentRouteSegment(document: { _sys: { filename: string } } & Record<string, unknown>) {
  const slug = typeof document.slug === "string" ? document.slug.trim() : "";
  return slug || document._sys.filename;
}

function mediaItemProps(item?: string | { file?: string; mimeType?: string; kind?: string }) {
  const file = typeof item === "string" ? item : item?.file;
  if (!file) {
    return {
      label: "Media item",
      style: { minHeight: "148px" },
    };
  }

  const mimeType = typeof item === "string" ? "" : String(item?.mimeType || item?.kind || "");
  const name = file.split("?")[0].split("/").pop() || file;
  const cleaned = file.split("?")[0].toLowerCase();
  const isVideo =
    mimeType.toLowerCase().startsWith("video/") ||
    [".mp4", ".mov", ".webm", ".m4v", ".avi"].some((ext) => cleaned.endsWith(ext));
  const itemId = getTinaSidebarMediaItemId(file);

  return {
    label: React.createElement(TinaMediaListItemLabel, {
      file,
      isVideo,
      name,
    }),
    ...(itemId ? { [TINA_SIDEBAR_MEDIA_ITEM_ROW_ATTRIBUTE]: itemId } : {}),
    style: {
      minHeight: "148px",
      transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
      ...(itemId
        ? {
            borderRadius: "8px",
          }
        : {}),
    },
  };
}

const mediaGroupItemProps = ((item: Record<string, unknown>) =>
  mediaItemProps(item as { file?: string; mimeType?: string; kind?: string })) as unknown as (
  item: object,
) => {
  key?: string;
  label?: string;
  style?: React.CSSProperties;
  [key: `data-${string}`]: string | undefined;
};

function homepageSectionImageFields() {
  return [
    {
      type: "string" as const,
      name: "imageSize",
      label: "Section Image Size",
      description: "Auto keeps the current per-image sizing logic. Choose a size only if you want to override the whole section.",
      options: HOMEPAGE_SECTION_IMAGE_SIZE_OPTIONS as unknown as string[],
      ui: { component: "select" as const },
    },
  ];
}

function imageSizeSettingField(name: string, label: string, description: string) {
  return {
    type: "string" as const,
    name,
    label,
    description,
    options: IMAGE_SIZE_SELECT_OPTIONS as unknown as string[],
    ui: { component: "select" as const },
  };
}

type TinaListItem = Record<string, unknown> | null | undefined;

function getListItemValue(item: TinaListItem, key: string): unknown {
  return item && typeof item === "object" ? item[key] : undefined;
}

function getListItemLabel(item: TinaListItem, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = getListItemValue(item, key);
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}

// ─── Shared block templates ─────────────────────────────────────
// Factor templates that are reused across multiple collections so they
// stay in sync. When adding new fields, watch for cross-template name
// collisions inside any collection's blocks union (e.g. avoid `body` /
// `content` names that conflict with rich-text fields elsewhere).

function sharedHeroSectionTemplate() {
  return {
    name: "hero" as const,
    label: "Hero Section",
    fields: [
      { type: "string" as const, name: "heading", label: "Heading" },
      { type: "string" as const, name: "subtext", label: "Subtext", ui: { component: "textarea" as const } },
      { type: "string" as const, name: "ctaLabel", label: "CTA Text" },
      { type: "string" as const, name: "ctaLink", label: "CTA Link" },
      { type: "image" as const, name: "backgroundImage", label: "Background Image" },
      ...homepageSectionImageFields(),
    ],
  };
}

function sharedProductsSectionTemplate() {
  return {
    name: "productsSection" as const,
    label: "Products Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      { type: "string" as const, name: "ctaLabel", label: "CTA Text" },
      { type: "string" as const, name: "ctaLink", label: "CTA Link" },
      ...homepageSectionImageFields(),
      {
        type: "object" as const,
        name: "products",
        label: "Products",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["name"], "Product") }) },
        fields: [
          { type: "string" as const, name: "name", label: "Name" },
          { type: "image" as const, name: "image", label: "Image" },
          { type: "string" as const, name: "link", label: "Link" },
        ],
      },
    ],
  };
}

function sharedServicesSectionTemplate() {
  return {
    name: "servicesSection" as const,
    label: "Services Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      ...homepageSectionImageFields(),
      {
        type: "object" as const,
        name: "services",
        label: "Services",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["title"], "Service") }) },
        fields: [
          { type: "string" as const, name: "title", label: "Title" },
          { type: "string" as const, name: "description", label: "Description", ui: { component: "textarea" as const } },
          { type: "image" as const, name: "image", label: "Image" },
          { type: "string" as const, name: "link", label: "Link" },
        ],
      },
    ],
  };
}

function sharedProjectsSectionTemplate() {
  return {
    name: "projectsSection" as const,
    label: "Projects Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      { type: "string" as const, name: "ctaLabel", label: "CTA Text" },
      { type: "string" as const, name: "ctaLink", label: "CTA Link" },
      {
        type: "object" as const,
        name: "projects",
        label: "Projects",
        list: true,
        description: "Pick up to five projects. Each tile links to the project detail page and uses the project's first image unless an override is set.",
        ui: {
          itemProps: (item: TinaListItem) => ({
            label: resolveProjectReferenceLabel((item as { project?: unknown })?.project),
          }),
        },
        fields: [
          {
            type: "reference" as const,
            name: "project",
            label: "Project",
            collections: ["project"],
            ui: {
              optionComponent: renderProjectReferenceOption,
              experimental___filter: filterProjectReferenceOptions,
            },
          },
          {
            type: "image" as const,
            name: "imageOverride",
            label: "Image Override (optional)",
            description: "Optional: overrides the project's first image. Leave blank to use the project's first image.",
          },
        ],
      },
      ...homepageSectionImageFields(),
    ],
  };
}

function sharedWhyUsSectionTemplate() {
  return {
    name: "whyUsSection" as const,
    label: "Why Us Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      {
        type: "rich-text" as const,
        name: "text1",
        label: "Text 1",
        description: "Use bold/italic to emphasize phrases. Headings, lists, links and images are intentionally disabled for this section.",
        overrides: {
          toolbar: ["bold" as const, "italic" as const],
        },
      },
      {
        type: "rich-text" as const,
        name: "text2",
        label: "Text 2",
        description: "Use bold/italic to emphasize phrases. Headings, lists, links and images are intentionally disabled for this section.",
        overrides: {
          toolbar: ["bold" as const, "italic" as const],
        },
      },
      ...homepageSectionImageFields(),
      {
        type: "object" as const,
        name: "features",
        label: "Features",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["title"], "Feature") }) },
        fields: [
          { type: "string" as const, name: "icon", label: "Icon (emoji)" },
          { type: "string" as const, name: "title", label: "Title" },
          { type: "string" as const, name: "description", label: "Description", ui: { component: "textarea" as const } },
          { type: "image" as const, name: "image", label: "Feature Image" },
        ],
      },
    ],
  };
}

function sharedTrustStripTemplate() {
  return {
    name: "trustStrip" as const,
    label: "Trust Message Strip",
    fields: [
      {
        type: "rich-text" as const,
        name: "trustStripContent",
        label: "Message",
        description: "Use bold to emphasize key phrases. Headings, lists, links and images are intentionally disabled for this section.",
        overrides: {
          toolbar: ["bold" as const, "italic" as const],
        },
      },
      { type: "image" as const, name: "trustStripTexture", label: "Background Texture" },
    ],
  };
}

function sharedAboutSectionTemplate() {
  return {
    name: "aboutSection" as const,
    label: "About Section",
    fields: [
      {
        type: "object" as const,
        name: "stats",
        label: "Stats",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Stat") }) },
        fields: [
          { type: "string" as const, name: "value", label: "Value" },
          { type: "string" as const, name: "label", label: "Label" },
        ],
      },
      { type: "image" as const, name: "membershipDesktopLogo", label: "Membership Logo (Desktop)" },
      { type: "image" as const, name: "membershipMobileTopLogo", label: "Membership Logo Top (Mobile)" },
      { type: "image" as const, name: "membershipMobileBottomLogo", label: "Membership Logo Bottom (Mobile)" },
      { type: "string" as const, name: "membershipLabel", label: "Membership Label" },
      { type: "string" as const, name: "partnershipLabel", label: "Partnership Label" },
      {
        type: "object" as const,
        name: "partnerLogos",
        label: "Partner Logos",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["alt"], "Partner logo") }) },
        fields: [
          { type: "image" as const, name: "logo", label: "Logo" },
          { type: "string" as const, name: "alt", label: "Alt Text" },
          { type: "string" as const, name: "href", label: "Partner Website" },
        ],
      },
      { type: "string" as const, name: "ctaLabel", label: "Button Text" },
      { type: "string" as const, name: "ctaLink", label: "Button Link" },
    ],
  };
}

function sharedContactSectionTemplate() {
  return {
    name: "contactSection" as const,
    label: "Contact Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      { type: "image" as const, name: "image", label: "Section Image" },
      ...homepageSectionImageFields(),
      { type: "string" as const, name: "nameLabel", label: "Name Field Label" },
      { type: "string" as const, name: "namePlaceholder", label: "Name Placeholder" },
      { type: "string" as const, name: "emailLabel", label: "Email Field Label" },
      { type: "string" as const, name: "emailPlaceholder", label: "Email Placeholder" },
      { type: "string" as const, name: "messageLabel", label: "Message Field Label" },
      { type: "string" as const, name: "messagePlaceholder", label: "Message Placeholder" },
      { type: "string" as const, name: "submitLabel", label: "Submit Button Label" },
    ],
  };
}

function sharedShowroomSectionTemplate() {
  return {
    name: "showroomSection" as const,
    label: "Our Showroom Section",
    fields: [
      { type: "string" as const, name: "showroomTitle", label: "Showroom Title" },
      { type: "image" as const, name: "texture", label: "Background Texture" },
      { type: "string" as const, name: "followUsLabel", label: "Follow Label" },
      {
        type: "string" as const,
        name: "mapEmbedUrl",
        label: "Google Maps Embed URL",
        ui: { component: "textarea" as const },
      },
    ],
  };
}

function sharedFaqSectionTemplate() {
  return {
    name: "faqSection" as const,
    label: "FAQ Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      {
        type: "object" as const,
        name: "tabs",
        label: "FAQ Tabs",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "FAQ Tab") }) },
        fields: [
          { type: "string" as const, name: "label", label: "Tab Label" },
          {
            type: "object" as const,
            name: "faqs",
            label: "FAQs",
            list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["question"], "FAQ") }) },
            fields: [
              { type: "string" as const, name: "question", label: "Question" },
              { type: "string" as const, name: "answer", label: "Answer", ui: { component: "textarea" as const } },
            ],
          },
        ],
      },
      {
        type: "object" as const,
        name: "faqs",
        label: "FAQs (single list)",
        list: true,
        description: "Alternative: flat FAQ list when tabs are not needed.",
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["question"], "FAQ") }) },
        fields: [
          { type: "string" as const, name: "question", label: "Question" },
          { type: "string" as const, name: "answer", label: "Answer", ui: { component: "textarea" as const } },
        ],
      },
    ],
  };
}

function sharedMiniFaqSectionTemplate() {
  return {
    name: "miniFaqSection" as const,
    label: "Mini FAQ Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      {
        type: "object" as const,
        name: "faqs",
        label: "FAQs",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["question"], "FAQ") }) },
        fields: [
          { type: "string" as const, name: "question", label: "Question" },
          { type: "string" as const, name: "answer", label: "Answer", ui: { component: "textarea" as const } },
        ],
      },
    ],
  };
}

function sharedShowroomBannerTemplate() {
  return {
    name: "showroomBanner" as const,
    label: "Showroom Banner",
    fields: [
      { type: "string" as const, name: "heading", label: "Heading" },
      { type: "string" as const, name: "subtext", label: "Subtext", ui: { component: "textarea" as const } },
      { type: "string" as const, name: "ctaLabel", label: "CTA Text" },
      { type: "string" as const, name: "ctaLink", label: "CTA Link" },
      { type: "image" as const, name: "image", label: "Main Image" },
      ...homepageSectionImageFields(),
    ],
  };
}

function sharedPartnersSectionTemplate(options?: {
  name?: "partnersSection" | "countertopPartnersSection" | "flooringPartnersSection";
  label?: string;
}) {
  return {
    name: options?.name ?? ("partnersSection" as const),
    label: options?.label ?? "Partners Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      { type: "string" as const, name: "description", label: "Body Text", ui: { component: "textarea" as const } },
      { type: "string" as const, name: "footnote", label: "Footnote" },
      {
        type: "object" as const,
        name: "partnerLogos",
        label: "Partner Logos",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["alt"], "Partner logo") }) },
        fields: [
          { type: "image" as const, name: "logo", label: "Logo" },
          { type: "string" as const, name: "alt", label: "Alt Text" },
          { type: "string" as const, name: "url", label: "External URL" },
        ],
      },
    ],
  };
}

function sharedSectionReferenceTemplate(
  name:
    | "sharedContactSection"
    | "sharedShowroomSection"
    | "sharedAboutSection"
    | "sharedPartnersSection"
    | "sharedCountertopPartnersSection"
    | "sharedFlooringPartnersSection",
  label: string,
  sharedSourceLabel: string,
) {
  return {
    name,
    label,
    fields: [
      {
        type: "string" as const,
        name: "sharedSection",
        label: "Shared Source",
        description: `${sharedSourceLabel} is edited once in Page Settings > Shared Sections and reused anywhere this block is placed.`,
        options: [{ label: sharedSourceLabel, value: name }],
        ui: { component: "select" as const },
      },
    ],
  };
}

function sharedSectionReferenceTemplates() {
  return [
    sharedSectionReferenceTemplate("sharedContactSection", "Shared: Contact Section", "Contact Section"),
    sharedSectionReferenceTemplate("sharedShowroomSection", "Shared: Our Showroom Section", "Our Showroom Section"),
    sharedSectionReferenceTemplate("sharedAboutSection", "Shared: About / Trust Section", "About / Trust Section"),
    sharedSectionReferenceTemplate("sharedPartnersSection", "Shared: Cabinet Partners", "Cabinet Partners"),
    sharedSectionReferenceTemplate("sharedCountertopPartnersSection", "Shared: Countertop Partners", "Countertop Partners"),
    sharedSectionReferenceTemplate("sharedFlooringPartnersSection", "Shared: Flooring Partners", "Flooring Partners"),
  ];
}

function sharedProcessSectionTemplate() {
  return {
    name: "processSection" as const,
    label: "Process Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      {
        type: "object" as const,
        name: "steps",
        label: "Steps",
        list: true,
        ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["title"], "Step") }) },
        fields: [
          { type: "number" as const, name: "number", label: "Step Number" },
          { type: "image" as const, name: "iconImage", label: "Step Icon" },
          { type: "string" as const, name: "title", label: "Title" },
          { type: "string" as const, name: "description", label: "Description", ui: { component: "textarea" as const } },
          { type: "string" as const, name: "icon", label: "Legacy Icon (optional)" },
        ],
      },
    ],
  };
}

function sharedAboutStorySectionTemplate() {
  return {
    name: "aboutStorySection" as const,
    label: "About Story Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      {
        type: "rich-text" as const,
        name: "body",
        label: "Story Content",
        templates: [
          {
            name: "ArticleImage" as const,
            label: "Article Image",
            fields: [
              { type: "image" as const, name: "image", label: "Image" },
              { type: "string" as const, name: "alt", label: "Alt Text" },
              { type: "string" as const, name: "caption", label: "Caption" },
              {
                type: "string" as const,
                name: "aspectRatio",
                label: "Aspect Ratio",
                options: [
                  { label: "16:9", value: "landscape" },
                  { label: "1:1", value: "square" },
                  { label: "3:4", value: "portrait" },
                ],
                ui: { component: "select" as const },
              },
            ],
          },
        ],
      },
    ],
  };
}

function sharedRichContentTemplate() {
  return {
    name: "richContent" as const,
    label: "Rich Text Content",
    fields: [
      { type: "string" as const, name: "title", label: "Title" },
      { type: "rich-text" as const, name: "body", label: "Content" },
    ],
  };
}

function sharedTextImageSectionTemplate() {
  return {
    name: "textImageSection" as const,
    label: "Info Section",
    fields: [
      { type: "string" as const, name: "title", label: "Section Title" },
      { type: "rich-text" as const, name: "paragraphs", label: "Body Paragraphs" },
      { type: "image" as const, name: "image", label: "Image" },
      {
        type: "string" as const,
        name: "imagePosition",
        label: "Image Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        ui: { component: "select" as const },
      },
      { type: "string" as const, name: "ctaLabel", label: "CTA Button Text (optional)" },
      { type: "string" as const, name: "ctaLink", label: "CTA Button Link (optional)" },
    ],
  };
}

function sharedPageSectionTemplates() {
  return [
    sharedHeroSectionTemplate(),
    sharedProductsSectionTemplate(),
    sharedServicesSectionTemplate(),
    sharedProjectsSectionTemplate(),
    sharedWhyUsSectionTemplate(),
    sharedTrustStripTemplate(),
    sharedAboutSectionTemplate(),
    sharedShowroomBannerTemplate(),
    sharedProcessSectionTemplate(),
    sharedFaqSectionTemplate(),
    sharedMiniFaqSectionTemplate(),
    sharedContactSectionTemplate(),
    sharedShowroomSectionTemplate(),
    sharedAboutStorySectionTemplate(),
    sharedRichContentTemplate(),
    sharedTextImageSectionTemplate(),
    sharedPartnersSectionTemplate(),
    sharedPartnersSectionTemplate({
      name: "countertopPartnersSection",
      label: "Countertop Partners Section",
    }),
    sharedPartnersSectionTemplate({
      name: "flooringPartnersSection",
      label: "Flooring Partners Section",
    }),
    ...sharedSectionReferenceTemplates(),
  ];
}

function sharedPageSectionTemplatesExcept(excludedNames: string[]) {
  const excluded = new Set(excludedNames);
  return sharedPageSectionTemplates().filter((template) => !excluded.has(template.name));
}

function serviceMainPageSettingsTemplate(name: string, label: string, route: string) {
  return {
    name,
    label,
    fields: [
      { type: "string" as const, name: "title", label: "Page Title", isTitle: true, required: true },
      seoFields(),
      {
        type: "object" as const,
        name: "blocks",
        label: "Page Sections",
        description: `Reorderable sections that render on ${route}. Add, delete, edit, and drag sections here.`,
        list: true,
        ui: { visualSelector: true },
        templates: sharedPageSectionTemplates(),
      },
    ],
  };
}

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: "public" },
  media: {
    loadCustomStore: async () => {
      const pack = await import("next-tinacms-s3");
      return pack.TinaCloudS3MediaStore;
    },
  },
  schema: {
    collections: [
      // ─── SITE CONFIGURATION: Header + Footer documents ────────
      {
        name: "global",
        label: "Site Configuration",
        path: "content/global",
        format: "json",
        match: {
          include: "@(header|footer|general)",
        },
        ui: {
          global: true,
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { type: "string", name: "siteName", label: "Site Name" },
          { type: "image", name: "logo", label: "Header Logo" },
          { type: "image", name: "footerLogo", label: "Footer Logo" },
          { type: "string", name: "phone", label: "Phone" },
          { type: "string", name: "address", label: "Address" },
          { type: "string", name: "email", label: "Email" },
          { type: "string", name: "hours", label: "Business Hours" },
          { type: "string", name: "ctaLabel", label: "CTA Button Text" },
          { type: "string", name: "ctaLink", label: "CTA Button Link" },
          { type: "string", name: "navSearchLabel", label: "Header Search Label" },
          { type: "string", name: "navSearchLink", label: "Header Search Link" },
          {
            // Supports two item types:
            // 1. Simple link: { label, href }  — href is set, no children
            // 2. Dropdown:   { label, children: [{ label, href }] } — href empty
            type: "object", name: "navLinks", label: "Nav Links", list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Link") }) },
            fields: [
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "href", label: "Link (leave empty for dropdown)" },
              {
                type: "object",
                name: "children",
                label: "Dropdown Items",
                list: true,
                templates: [
                  {
                    name: "simpleLink",
                    label: "Simple Link",
                    ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Simple Link") }) },
                    fields: [
                      { type: "string", name: "label", label: "Label" },
                      { type: "string", name: "href", label: "Link" },
                    ],
                  },
                  {
                    name: "cabinetCatalog",
                    label: "Cabinet Catalog",
                    ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Cabinet Catalog") }) },
                    fields: [
                      { type: "string", name: "label", label: "Label" },
                      { type: "string", name: "href", label: "Link" },
                      { type: "string", name: "buttonLabel", label: "Button Label" },
                      { type: "string", name: "buttonLink", label: "Button Link" },
                      {
                        type: "object",
                        name: "catalogItems",
                        label: "Catalog Items",
                        list: true,
                        description: "Search and select cabinet products to show in the Products dropdown.",
                        ui: {
                          itemProps: (item: TinaListItem) => ({
                            label: resolveCabinetDocumentReferenceLabel(getListItemValue(item, "product")) || "Catalog item",
                          }),
                        },
                        fields: [
                          {
                            type: "reference",
                            name: "product",
                            label: "Cabinet",
                            collections: ["cabinet"],
                            ui: {
                              optionComponent: renderCabinetReferenceOption,
                              experimental___filter: filterCabinetReferenceOptions,
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    name: "countertopCatalog",
                    label: "Countertop Catalog",
                    ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Countertop Catalog") }) },
                    fields: [
                      { type: "string", name: "label", label: "Label" },
                      { type: "string", name: "href", label: "Link" },
                      { type: "string", name: "buttonLabel", label: "Button Label" },
                      { type: "string", name: "buttonLink", label: "Button Link" },
                      {
                        type: "object",
                        name: "catalogItems",
                        label: "Catalog Items",
                        list: true,
                        description: "Search and select countertop products to show in the Products dropdown.",
                        ui: {
                          itemProps: (item: TinaListItem) => ({
                            label: resolveCountertopDocumentReferenceLabel(getListItemValue(item, "product")) || "Catalog item",
                          }),
                        },
                        fields: [
                          {
                            type: "reference",
                            name: "product",
                            label: "Countertop",
                            collections: ["countertop"],
                            ui: {
                              optionComponent: renderCountertopReferenceOption,
                              experimental___filter: filterCountertopReferenceOptions,
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    name: "flooringCatalog",
                    label: "Flooring Catalog",
                    ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Flooring Catalog") }) },
                    fields: [
                      { type: "string", name: "label", label: "Label" },
                      { type: "string", name: "href", label: "Link" },
                      { type: "string", name: "buttonLabel", label: "Button Label" },
                      { type: "string", name: "buttonLink", label: "Button Link" },
                      {
                        type: "object",
                        name: "catalogItems",
                        label: "Catalog Items",
                        list: true,
                        description: "Search and select flooring products to show in the Products dropdown.",
                        ui: {
                          itemProps: (item: TinaListItem) => ({
                            label: resolveFlooringDocumentReferenceLabel(getListItemValue(item, "product")) || "Catalog item",
                          }),
                        },
                        fields: [
                          {
                            type: "reference",
                            name: "product",
                            label: "Flooring",
                            collections: ["flooring"],
                            ui: {
                              optionComponent: renderFlooringReferenceOption,
                              experimental___filter: filterFlooringReferenceOptions,
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "object", name: "footerLinks", label: "Footer Links", list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label"], "Link") }) },
            fields: [
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "href", label: "Link" },
            ],
          },
          { type: "string", name: "pinterestUrl", label: "Pinterest URL" },
          { type: "string", name: "instagramUrl", label: "Instagram URL" },
          { type: "string", name: "facebookUrl", label: "Facebook URL" },
          { type: "string", name: "headScripts", label: "Head Scripts", ui: { component: "textarea" } },
          { type: "string", name: "bodyScripts", label: "Body Scripts", ui: { component: "textarea" } },
          { type: "string", name: "copyrightText", label: "Copyright Text" },
        ],
      },
      {
        name: "catalogSettings",
        label: "Catalog Settings",
        path: "content/global",
        format: "json",
        match: {
          include: "catalog-settings",
        },
        ui: {
          global: true,
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            type: "object",
            name: "stainTypes",
            label: "Stain Type Options",
            list: true,
            required: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label", "value"], "Stain type") }) },
            fields: [
              { type: "string", name: "value", label: "Value", required: true },
              { type: "string", name: "label", label: "Label" },
              { type: "image", name: "image", label: "Image" },
            ],
          },
          {
            type: "object",
            name: "doorStyles",
            label: "Door Style Options",
            list: true,
            required: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label", "value"], "Door style") }) },
            fields: [
              { type: "string", name: "value", label: "Value", required: true },
              { type: "string", name: "label", label: "Label" },
              { type: "image", name: "image", label: "Image" },
            ],
          },
          {
            type: "string",
            name: "rooms",
            label: "Rooms",
            list: true,
            required: true,
          },
          {
            type: "object",
            name: "paintOptions",
            label: "Paint Options",
            list: true,
            required: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label", "value"], "Paint option") }) },
            fields: [
              { type: "string", name: "value", label: "Value", required: true },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "swatchColor", label: "Swatch Color" },
              { type: "image", name: "image", label: "Swatch Image" },
            ],
          },
          {
            type: "object",
            name: "countertopTypes",
            label: "Countertop Types",
            list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label", "value"], "Countertop type") }) },
            fields: [
              { type: "string", name: "value", label: "Value", required: true },
              { type: "string", name: "label", label: "Label" },
              { type: "image", name: "image", label: "Image" },
            ],
          },
          {
            type: "object",
            name: "flooringTypes",
            label: "Flooring Types",
            list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["label", "value"], "Flooring type") }) },
            fields: [
              { type: "string", name: "value", label: "Value", required: true },
              { type: "string", name: "label", label: "Label" },
              { type: "image", name: "image", label: "Image" },
            ],
          },
        ],
      },
      {
        name: "pageSettings",
        label: "Page Settings",
        path: "content/global",
        format: "json",
        match: {
          include:
            "@(shared-sections|cabinets-main-page-settings|countertops-main-page-settings|flooring-main-page-settings|kitchen-remodel-main-page-settings|bathroom-remodel-main-page-settings|cabinets-overview-page-settings|countertops-overview-page-settings|flooring-overview-page-settings|gallery-page-settings|blog-page-settings|project-page-settings|collection-page-settings|post-page-settings|cabinet-page-settings|countertop-page-settings|flooring-page-settings)",
        },
        ui: {
          global: true,
          allowedActions: { create: false, delete: false },
        },
        templates: [
          {
            name: "sharedSections",
            label: "Shared Sections",
            fields: [
              {
                type: "object",
                name: "contactSection",
                label: "Contact Section",
                fields: sharedContactSectionTemplate().fields,
              },
              {
                type: "object",
                name: "showroomSection",
                label: "Our Showroom Section",
                fields: sharedShowroomSectionTemplate().fields,
              },
              {
                type: "object",
                name: "aboutSection",
                label: "About / Trust Section",
                fields: sharedAboutSectionTemplate().fields,
              },
              {
                type: "object",
                name: "partnersSection",
                label: "Cabinet Partners",
                fields: sharedPartnersSectionTemplate().fields,
              },
              {
                type: "object",
                name: "countertopPartnersSection",
                label: "Countertop Partners",
                fields: sharedPartnersSectionTemplate({
                  name: "countertopPartnersSection",
                  label: "Countertop Partners",
                }).fields,
              },
              {
                type: "object",
                name: "flooringPartnersSection",
                label: "Flooring Partners",
                fields: sharedPartnersSectionTemplate({
                  name: "flooringPartnersSection",
                  label: "Flooring Partners",
                }).fields,
              },
            ],
          },
          serviceMainPageSettingsTemplate("cabinetsMainPage", "Cabinets Page (/cabinets)", "/cabinets"),
          serviceMainPageSettingsTemplate("countertopsMainPage", "Countertops Page (/countertops)", "/countertops"),
          serviceMainPageSettingsTemplate("flooringMainPage", "Flooring Page (/flooring)", "/flooring"),
          serviceMainPageSettingsTemplate("kitchenRemodelMainPage", "Kitchen Remodel Page (/kitchen-remodel)", "/kitchen-remodel"),
          serviceMainPageSettingsTemplate("bathroomRemodelMainPage", "Bathroom Remodel Page (/bathroom-remodel)", "/bathroom-remodel"),
          {
            name: "cabinetsOverview",
            label: "Cabinet Catalog",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on the /cabinets/catalog page. The Catalog Grid block (page title, filters, product grid, pagination) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "cabinetCatalogGrid",
                    label: "Cabinet Catalog Grid (filters + product grid — required)",
                    fields: [
                      { type: "string" as const, name: "pageTitle", label: "Page Title" },
                      imageSizeSettingField(
                        "cardImageSize",
                        "Card Images",
                        "Controls the main product grid card images on /cabinets/catalog.",
                      ),
                      imageSizeSettingField(
                        "filterImageSize",
                        "Filter Images",
                        "Controls the visual filter cards on /cabinets/catalog.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "countertopsOverview",
            label: "Countertop Catalog",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on the /countertops/catalog page. The Catalog Grid block (page title, filters, product grid, pagination) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "countertopCatalogGrid",
                    label: "Countertop Catalog Grid (filters + product grid — required)",
                    fields: [
                      { type: "string" as const, name: "pageTitle", label: "Page Title" },
                      imageSizeSettingField(
                        "cardImageSize",
                        "Card Images",
                        "Controls the main product grid card images on /countertops/catalog.",
                      ),
                      imageSizeSettingField(
                        "filterImageSize",
                        "Filter Images",
                        "Controls the visual filter cards on /countertops/catalog.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "flooringOverview",
            label: "Flooring Catalog",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on the /flooring/catalog page. The Catalog Grid block (page title, filters, product grid, pagination) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "flooringCatalogGrid",
                    label: "Flooring Catalog Grid (filters + product grid — required)",
                    fields: [
                      { type: "string" as const, name: "pageTitle", label: "Page Title" },
                      imageSizeSettingField(
                        "cardImageSize",
                        "Card Images",
                        "Controls the main product grid card images on /flooring/catalog.",
                      ),
                      imageSizeSettingField(
                        "filterImageSize",
                        "Filter Images",
                        "Controls the visual filter cards on /flooring/catalog.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "gallery",
            label: "Gallery Page (/gallery)",
            fields: [
              { type: "string", name: "title", label: "Page Title", isTitle: true, required: true },
              seoFields(),
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on /gallery. The Gallery Grid block is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "galleryProjectGrid",
                    label: "Gallery Grid (filters + project grid — required)",
                    fields: [
                      { type: "string", name: "pageTitle", label: "Page Title" },
                      imageSizeSettingField(
                        "galleryOverviewProjectCardImageSize",
                        "Project Card Images",
                        "Controls the main project grid images on /gallery.",
                      ),
                      imageSizeSettingField(
                        "galleryOverviewFilterImageSize",
                        "Filter Images",
                        "Controls the visual filter cards on /gallery.",
                      ),
                      {
                        type: "string",
                        name: "specialityTitle",
                        label: "Speciality Section Title",
                        description: "Heading shown above the Speciality (collections) strip on /gallery.",
                      },
                      {
                        type: "boolean",
                        name: "specialityEnabled",
                        label: "Show Speciality Section",
                        description: "Hide the Speciality strip without deleting collections.",
                      },
                      imageSizeSettingField(
                        "specialityCardImageSize",
                        "Speciality Card Images",
                        "Controls the cover-image size on Speciality cards.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "blog",
            label: "Blog Page (/blog)",
            fields: [
              { type: "string", name: "title", label: "Page Title", isTitle: true, required: true },
              seoFields(),
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on /blog. The Blog Posts Grid block is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "blogPostsGrid",
                    label: "Blog Posts Grid (post grid + pagination — required)",
                    fields: [
                      { type: "string" as const, name: "pageTitle", label: "Page Title" },
                      { type: "number" as const, name: "postsPerPage", label: "Posts Per Page" },
                      imageSizeSettingField(
                        "postCardImageSize",
                        "Post Card Images",
                        "Controls the post card images on /blog.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "project",
            label: "Project",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on every project detail page. The Project Info and Materials blocks pull data (cabinets, countertops, flooring, gallery media) directly from each project document.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "projectInfo",
                    label: "Project Info (title, description, gallery — pulled from each project)",
                    fields: [
                      { type: "string" as const, name: "breadcrumbLabel", label: "Breadcrumb Label" },
                      { type: "string" as const, name: "breadcrumbLink", label: "Breadcrumb Link" },
                      imageSizeSettingField(
                        "galleryImageSize",
                        "Gallery Grid Images",
                        "Controls the project gallery grid images on project detail pages.",
                      ),
                      imageSizeSettingField(
                        "lightboxImageSize",
                        "Lightbox Images",
                        "Controls the expanded lightbox image on project detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "projectMaterials",
                    label: "Materials Used (pulled per project)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      { type: "string" as const, name: "cabinetTitle", label: "Cabinet Title" },
                      {
                        type: "image" as const,
                        name: "cabinetPlaceholder",
                        label: "Cabinet Placeholder (shown when cabinet product is not linked but a custom name is provided)",
                      },
                      { type: "string" as const, name: "countertopTitle", label: "Countertop Title" },
                      {
                        type: "image" as const,
                        name: "countertopPlaceholder",
                        label: "Countertop Placeholder (shown when countertop product is not linked but a custom name is provided)",
                      },
                      { type: "string" as const, name: "flooringTitle", label: "Flooring Title" },
                      {
                        type: "image" as const,
                        name: "flooringPlaceholder",
                        label: "Flooring Placeholder (shown when flooring product is not linked but a custom name is provided)",
                      },
                      imageSizeSettingField(
                        "imageSize",
                        "Material Card Images",
                        "Controls the cabinet, countertop, and flooring card images on project detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "projectRelatedProjects",
                    label: "Related Projects (pulled per project)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      { type: "string" as const, name: "ctaLabel", label: "CTA Label" },
                      { type: "string" as const, name: "ctaLink", label: "CTA Link" },
                      imageSizeSettingField(
                        "imageSize",
                        "Related Project Images",
                        "Controls the related-project card images on project detail pages.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "collection",
            label: "Collection",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on every collection detail page. The Collection Info block (title, description, gallery) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "collectionInfo",
                    label: "Collection Info (title, description, gallery — pulled from each collection)",
                    fields: [
                      { type: "string" as const, name: "breadcrumbLabel", label: "Breadcrumb Label" },
                      { type: "string" as const, name: "breadcrumbLink", label: "Breadcrumb Link" },
                      imageSizeSettingField(
                        "galleryImageSize",
                        "Gallery Grid Images",
                        "Controls the gallery grid images on collection detail pages.",
                      ),
                      imageSizeSettingField(
                        "lightboxImageSize",
                        "Lightbox Images",
                        "Controls the expanded lightbox image on collection detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "collectionRelatedProjects",
                    label: "Related Projects (pulled per collection)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      { type: "string" as const, name: "ctaLabel", label: "CTA Label" },
                      { type: "string" as const, name: "ctaLink", label: "CTA Link" },
                      imageSizeSettingField(
                        "imageSize",
                        "Related Project Images",
                        "Controls the related-project card images on collection detail pages.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "post",
            label: "Post Page (/post/[slug])",
            fields: [
              { type: "string", name: "title", label: "Page Title", isTitle: true, required: true },
              seoFields(),
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on every post detail page. The Post Content block (hero + body — pulled per post) is required and will be injected at the top if missing. Add, delete, edit, and drag sections here.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "postContent",
                    label: "Post Content (hero + body — pulled from each post)",
                    fields: [
                      { type: "string" as const, name: "breadcrumbLabel", label: "Breadcrumb Label" },
                      imageSizeSettingField(
                        "heroImageSize",
                        "Hero Image",
                        "Controls the hero image on /post/[slug] pages.",
                      ),
                    ],
                  },
                  {
                    name: "postRelatedArticles",
                    label: "Related Articles + Prev/Next (pulled per post)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      imageSizeSettingField(
                        "imageSize",
                        "Related Article Images",
                        "Controls the related-article card images on /post/[slug] pages.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "cabinet",
            label: "Cabinet",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on every cabinet detail page. The Product Info block (gallery, code, name, description, technical details) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "cabinetProductInfo",
                    label: "Product Info (title, gallery, description — pulled from each cabinet)",
                    fields: [
                      { type: "string" as const, name: "breadcrumbLabel", label: "Breadcrumb Label" },
                      { type: "string" as const, name: "technicalDetailsTitle", label: "Technical Details Title" },
                      { type: "string" as const, name: "contactButtonLabel", label: "Contact Button Label" },
                      { type: "string" as const, name: "descriptionLabel", label: "Description Label" },
                      imageSizeSettingField(
                        "galleryThumbImageSize",
                        "Gallery Thumbnail Images",
                        "Controls the thumbnail rail on cabinet detail pages.",
                      ),
                      imageSizeSettingField(
                        "galleryMainImageSize",
                        "Gallery Main Image",
                        "Controls the main gallery image on cabinet detail pages.",
                      ),
                      imageSizeSettingField(
                        "galleryLightboxImageSize",
                        "Gallery Lightbox Image",
                        "Controls the expanded lightbox image on cabinet detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "projectsUsingThisProduct",
                    label: "Material in Real Projects (pulled per cabinet)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      {
                        type: "string" as const,
                        name: "description",
                        label: "Section Description",
                        ui: { component: "textarea" as const },
                      },
                      imageSizeSettingField(
                        "imageSize",
                        "Project Images",
                        "Controls the project images in this section on cabinet detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "relatedProducts",
                    label: "Related Products (pulled per cabinet)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      { type: "string" as const, name: "subtitle", label: "Subtitle" },
                      imageSizeSettingField(
                        "imageSize",
                        "Related Product Images",
                        "Controls the related product card images on cabinet detail pages.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "countertop",
            label: "Countertop",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on every countertop detail page. The Product Info block (gallery, code, name, description, technical details) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "countertopProductInfo",
                    label: "Product Info (title, gallery, description — pulled from each countertop)",
                    fields: [
                      { type: "string" as const, name: "breadcrumbLabel", label: "Breadcrumb Label" },
                      { type: "string" as const, name: "technicalDetailsTitle", label: "Technical Details Title" },
                      { type: "string" as const, name: "contactButtonLabel", label: "Contact Button Label" },
                      { type: "string" as const, name: "descriptionLabel", label: "Description Label" },
                      imageSizeSettingField(
                        "galleryThumbImageSize",
                        "Gallery Thumbnail Images",
                        "Controls the thumbnail rail on countertop detail pages.",
                      ),
                      imageSizeSettingField(
                        "galleryMainImageSize",
                        "Gallery Main Image",
                        "Controls the main gallery image on countertop detail pages.",
                      ),
                      imageSizeSettingField(
                        "galleryLightboxImageSize",
                        "Gallery Lightbox Image",
                        "Controls the expanded lightbox image on countertop detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "projectsUsingThisProduct",
                    label: "Material in Real Projects (pulled per countertop)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      {
                        type: "string" as const,
                        name: "description",
                        label: "Section Description",
                        ui: { component: "textarea" as const },
                      },
                      imageSizeSettingField(
                        "imageSize",
                        "Project Images",
                        "Controls the project images in this section on countertop detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "relatedProducts",
                    label: "Related Products (pulled per countertop)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      { type: "string" as const, name: "subtitle", label: "Subtitle" },
                      imageSizeSettingField(
                        "imageSize",
                        "Related Product Images",
                        "Controls the related product card images on countertop detail pages.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
          {
            name: "flooring",
            label: "Flooring",
            fields: [
              {
                type: "object",
                name: "blocks",
                label: "Page Sections",
                description:
                  "Reorderable sections that render on every flooring detail page. The Product Info block (gallery, code, name, description, technical details) is required and will be injected at the top if missing.",
                list: true,
                ui: { visualSelector: true },
                templates: [
                  {
                    name: "flooringProductInfo",
                    label: "Product Info (title, gallery, description — pulled from each flooring product)",
                    fields: [
                      { type: "string" as const, name: "breadcrumbLabel", label: "Breadcrumb Label" },
                      { type: "string" as const, name: "technicalDetailsTitle", label: "Technical Details Title" },
                      { type: "string" as const, name: "contactButtonLabel", label: "Contact Button Label" },
                      { type: "string" as const, name: "descriptionLabel", label: "Description Label" },
                      imageSizeSettingField(
                        "galleryThumbImageSize",
                        "Gallery Thumbnail Images",
                        "Controls the thumbnail rail on flooring detail pages.",
                      ),
                      imageSizeSettingField(
                        "galleryMainImageSize",
                        "Gallery Main Image",
                        "Controls the main gallery image on flooring detail pages.",
                      ),
                      imageSizeSettingField(
                        "galleryLightboxImageSize",
                        "Gallery Lightbox Image",
                        "Controls the expanded lightbox image on flooring detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "projectsUsingThisProduct",
                    label: "Flooring in Real Projects (pulled per flooring product)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      {
                        type: "string" as const,
                        name: "description",
                        label: "Section Description",
                        ui: { component: "textarea" as const },
                      },
                      imageSizeSettingField(
                        "imageSize",
                        "Project Images",
                        "Controls the project images in this section on flooring detail pages.",
                      ),
                    ],
                  },
                  {
                    name: "relatedProducts",
                    label: "Related Products (pulled per flooring product)",
                    fields: [
                      { type: "string" as const, name: "title", label: "Section Title" },
                      { type: "string" as const, name: "subtitle", label: "Subtitle" },
                      imageSizeSettingField(
                        "imageSize",
                        "Related Product Images",
                        "Controls the related product card images on flooring detail pages.",
                      ),
                    ],
                  },
                  ...sharedPageSectionTemplates(),
                ],
              },
            ],
          },
        ],
      },

      // ─── PAGES: home, about-us, contact-us, privacy-policy ─────
      {
        name: "page",
        label: "Pages",
        path: "content/pages",
        match: { include: "@(home|about-us|contact-us|privacy-policy)" },
        ui: {
          router: ({ document }) => {
            if (document._sys.filename === "home") return "/";
            return `/${document._sys.filename}`;
          },
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { type: "string", name: "title", label: "Page Title", isTitle: true, required: true },
          seoFields(),
          {
            type: "object", name: "blocks", label: "Page Sections", list: true,
            ui: { visualSelector: true },
            templates: sharedPageSectionTemplates(),
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            description: "Rich-text body. Used by simple pages like Privacy Policy.",
            isBody: true,
            templates: [
              {
                name: "ArticleImage",
                label: "Article Image",
                fields: [
                  { type: "image", name: "image", label: "Image" },
                  { type: "string", name: "alt", label: "Alt Text" },
                  { type: "string", name: "caption", label: "Caption" },
                  {
                    type: "string",
                    name: "aspectRatio",
                    label: "Aspect Ratio",
                    options: [
                      { label: "16:9", value: "landscape" },
                      { label: "1:1", value: "square" },
                      { label: "3:4", value: "portrait" },
                    ],
                    ui: { component: "select" },
                  },
                ],
              },
            ],
          },
        ],
      },

      // ─── SERVICES: /cabinets, /countertops, etc. ───────────────
      {
        name: "service",
        label: "Services",
        path: "content/services",
        ui: {
          router: ({ document }) => `/${document._sys.filename}`,
        },
        fields: [
          { type: "string", name: "title", label: "Page Title", isTitle: true, required: true },
          seoFields(),
          {
            type: "object", name: "blocks", label: "Page Sections", list: true,
            templates: [
              {
                name: "hero", label: "Hero Section",
                fields: [
                  { type: "string", name: "heading", label: "Heading" },
                  { type: "string", name: "subtext", label: "Subtext", ui: { component: "textarea" } },
                  { type: "string", name: "ctaLabel", label: "CTA Text" },
                  { type: "string", name: "ctaLink", label: "CTA Link" },
                  { type: "image", name: "backgroundImage", label: "Background Image" },
                ],
              },
              {
                name: "features", label: "Features Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object", name: "items", label: "Feature Items", list: true,
                    ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["title"], "Feature") }) },
                    fields: [
                      { type: "string", name: "icon", label: "Icon" },
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                    ],
                  },
                ],
              },
              {
                name: "gallery", label: "Gallery Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "image", name: "images", label: "Images", list: true },
                ],
              },
              {
                name: "ctaBanner", label: "CTA Banner",
                fields: [
                  { type: "string", name: "heading", label: "Heading" },
                  { type: "string", name: "buttonText", label: "Button Text" },
                  { type: "string", name: "buttonLink", label: "Button Link" },
                ],
              },
              ...sharedPageSectionTemplatesExcept(["hero"]),
            ],
          },
        ],
      },

      // ─── CABINETS: Cabinet door catalog imported from Strapi ───
      {
        name: "cabinet",
        label: "Cabinet Doors",
        path: "content/cabinets",
        format: "md",
        ui: {
          router: ({ document }) => `/cabinets/${document._sys.filename}`,
        },
        fields: [
          {
            type: "boolean",
            name: "published",
            label: "Published",
            description: "Only published cabinet doors are shown in the catalog.",
          },
          { type: "string", name: "name", label: "Name", isTitle: true, required: true },
          { type: "string", name: "code", label: "Code", required: true },
          {
            type: "string",
            name: "doorStyle",
            label: "Door Style",
            options: catalogSettingsOptions.doorStyles,
            description: "Used for cabinet catalog filtering.",
          },
          {
            type: "string",
            name: "paint",
            label: "Paint",
            options: catalogSettingsOptions.paintOptions,
            description: "Optional. Fill this or Stain Type.",
          },
          {
            type: "string",
            name: "stainType",
            label: "Stain Type",
            options: catalogSettingsOptions.stainTypes,
            description: "Optional. Fill this or Paint.",
          },
          {
            type: "object",
            name: "technicalDetails",
            label: "Technical Details",
            list: true,
            ui: { itemProps: (item?: { key?: string }) => ({ label: item?.key || "Detail" }) },
            fields: [
              { type: "string", name: "key", label: "Key" },
              { type: "string", name: "value", label: "Value" },
            ],
          },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          { type: "image", name: "picture", label: "Primary Picture" },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: mediaGroupItemProps,
            },
            fields: [
              { type: "image", name: "file", label: "File", ui: { component: renderLargeMediaPreviewField } },
              { type: "boolean", name: "roomPriority", label: "Room Priority" },
              { type: "boolean", name: "paintPriority", label: "Paint Priority" },
              { type: "boolean", name: "stainPriority", label: "Stain Priority" },
              { type: "boolean", name: "countertopPriority", label: "Countertop Priority" },
              { type: "boolean", name: "flooring", label: "Flooring" },
              { type: "string", name: "room", label: "Room", options: catalogSettingsOptions.rooms },
              { type: "string", name: "cabinetPaints", label: "Cabinet Paints", list: true, options: catalogSettingsOptions.paintOptions },
              { type: "string", name: "cabinetStains", label: "Cabinet Stains", list: true, options: catalogSettingsOptions.stainTypes },
              { type: "string", name: "countertop", label: "Countertop", options: catalogSettingsOptions.countertopTypes },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
            ],
          },
          {
            type: "object",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Search and select project entries related to this cabinet door.",
            ui: {
              itemProps: cabinetRelatedProjectsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "project",
                label: "Project",
                collections: ["project"],
                ui: {
                  optionComponent: renderProjectReferenceOption,
                  experimental___filter: filterProjectReferenceOptions,
                },
              },
            ],
          },
          {
            type: "object",
            name: "relatedProducts",
            label: "Related Products",
            list: true,
            description: "Select other cabinet door entries from this collection.",
            ui: {
              itemProps: cabinetRelatedProductsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "product",
                label: "Cabinet Door",
                collections: ["cabinet"],
                ui: {
                  optionComponent: renderCabinetReferenceOption,
                  experimental___filter: filterCabinetReferenceOptions,
                },
              },
            ],
          },
          { type: "number", name: "sourceId", label: "Source ID (Strapi)" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
          { type: "string", name: "slug", label: "Slug", required: true },
        ],
      },
      {
        name: "countertop",
        label: "Countertops",
        path: "content/countertops",
        format: "md",
        ui: {
          router: ({ document }) => `/countertops/${resolveDocumentRouteSegment(document as { _sys: { filename: string } } & Record<string, unknown>)}`,
        },
        fields: [
          {
            type: "boolean",
            name: "published",
            label: "Published",
            description: "Only published countertop slabs are shown in the catalog.",
          },
          { type: "string", name: "name", label: "Name", isTitle: true, required: true },
          { type: "string", name: "code", label: "Code", required: true },
          {
            type: "string",
            name: "countertopType",
            label: "Countertop Type",
            options: catalogSettingsOptions.countertopTypes,
          },
          {
            type: "object",
            name: "technicalDetails",
            label: "Technical Details",
            list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["key"], "Detail") }) },
            fields: [
              { type: "string", name: "key", label: "Key" },
              { type: "string", name: "value", label: "Value" },
              { type: "string", name: "unit", label: "Unit" },
              { type: "number", name: "order", label: "Order" },
            ],
          },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          { type: "image", name: "picture", label: "Primary Picture" },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: mediaGroupItemProps,
            },
            fields: [
              { type: "image", name: "file", label: "File", ui: { component: renderLargeMediaPreviewField } },
              { type: "string", name: "kind", label: "Kind", options: ["image", "video", "other"] },
              { type: "string", name: "mimeType", label: "MIME Type" },
              { type: "boolean", name: "isPrimary", label: "Primary" },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "altText", label: "Alt Text" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
              { type: "number", name: "sourceId", label: "Source Media ID (Strapi)" },
            ],
          },
          {
            type: "object",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Search and select project entries related to this countertop.",
            ui: {
              itemProps: countertopRelatedProjectsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "project",
                label: "Project",
                collections: ["project"],
                ui: {
                  optionComponent: renderProjectReferenceOption,
                  experimental___filter: filterProjectReferenceOptions,
                },
              },
            ],
          },
          {
            type: "object",
            name: "relatedProducts",
            label: "Related Products",
            list: true,
            description: "Select other countertop entries from this collection.",
            ui: {
              itemProps: countertopRelatedProductsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "product",
                label: "Countertop",
                collections: ["countertop"],
                ui: {
                  optionComponent: renderCountertopReferenceOption,
                  experimental___filter: filterCountertopReferenceOptions,
                },
              },
            ],
          },
          { type: "number", name: "sourceId", label: "Source ID (Strapi)" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
          { type: "string", name: "slug", label: "Slug", required: true },
        ],
      },
      {
        name: "flooring",
        label: "Flooring",
        path: "content/flooring",
        format: "md",
        ui: {
          router: ({ document }) => `/flooring/catalog/${resolveDocumentRouteSegment(document as { _sys: { filename: string } } & Record<string, unknown>)}`,
        },
        fields: [
          {
            type: "boolean",
            name: "published",
            label: "Published",
            description: "Only published flooring products are shown in the catalog.",
          },
          { type: "string", name: "name", label: "Name", isTitle: true, required: true },
          { type: "string", name: "code", label: "Code", required: true },
          {
            type: "string",
            name: "flooringType",
            label: "Flooring Type",
            options: catalogSettingsOptions.flooringTypes,
          },
          {
            type: "object",
            name: "technicalDetails",
            label: "Technical Details",
            list: true,
            ui: { itemProps: (item: TinaListItem) => ({ label: getListItemLabel(item, ["key"], "Detail") }) },
            fields: [
              { type: "string", name: "key", label: "Key" },
              { type: "string", name: "value", label: "Value" },
              { type: "string", name: "unit", label: "Unit" },
              { type: "number", name: "order", label: "Order" },
            ],
          },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          { type: "image", name: "picture", label: "Primary Picture" },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: mediaGroupItemProps,
            },
            fields: [
              { type: "image", name: "file", label: "File", ui: { component: renderLargeMediaPreviewField } },
              { type: "string", name: "kind", label: "Kind", options: ["image", "video", "other"] },
              { type: "string", name: "mimeType", label: "MIME Type" },
              { type: "boolean", name: "isPrimary", label: "Primary" },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "altText", label: "Alt Text" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
              { type: "number", name: "sourceId", label: "Source Media ID" },
            ],
          },
          {
            type: "object",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Search and select project entries related to this flooring product.",
            ui: {
              itemProps: flooringRelatedProjectsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "project",
                label: "Project",
                collections: ["project"],
                ui: {
                  optionComponent: renderProjectReferenceOption,
                  experimental___filter: filterProjectReferenceOptions,
                },
              },
            ],
          },
          {
            type: "object",
            name: "relatedProducts",
            label: "Related Products",
            list: true,
            description: "Select other flooring entries from this collection.",
            ui: {
              itemProps: flooringRelatedProductsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "product",
                label: "Flooring",
                collections: ["flooring"],
                ui: {
                  optionComponent: renderFlooringReferenceOption,
                  experimental___filter: filterFlooringReferenceOptions,
                },
              },
            ],
          },
          { type: "number", name: "sourceId", label: "Source ID" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
          { type: "string", name: "slug", label: "Slug", required: true },
        ],
      },
      {
        name: "project",
        label: "Projects",
        path: "content/projects",
        format: "md",
        ui: {
          router: ({ document }) => `/projects/${document._sys.filename}`,
        },
        fields: [
          {
            type: "boolean",
            name: "published",
            label: "Published",
            description: "Only published projects are shown on the gallery page.",
          },
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: mediaGroupItemProps,
            },
            fields: [
              { type: "image", name: "file", label: "File", ui: { component: renderLargeMediaPreviewField } },
              { type: "boolean", name: "roomPriority", label: "Room Priority" },
              { type: "boolean", name: "paintPriority", label: "Paint Priority" },
              { type: "boolean", name: "stainPriority", label: "Stain Priority" },
              { type: "boolean", name: "countertopPriority", label: "Countertop Priority" },
              { type: "boolean", name: "flooring", label: "Flooring" },
              { type: "string", name: "room", label: "Room", options: catalogSettingsOptions.rooms },
              { type: "string", name: "cabinetPaints", label: "Cabinet Paints", list: true, options: catalogSettingsOptions.paintOptions },
              { type: "string", name: "cabinetStains", label: "Cabinet Stains", list: true, options: catalogSettingsOptions.stainTypes },
              { type: "string", name: "countertop", label: "Countertop", options: catalogSettingsOptions.countertopTypes },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
            ],
          },
          {
            type: "object",
            name: "cabinetProducts",
            label: "Cabinet Doors",
            list: true,
            description: "Select cabinet door products used in this project. If no product is selected, fill in a custom name to display it without a link.",
            ui: {
              itemProps: projectCabinetProductsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "cabinet",
                label: "Cabinet Door (linked product)",
                collections: ["cabinet"],
                ui: {
                  optionComponent: renderCabinetReferenceOption,
                  experimental___filter: filterCabinetReferenceOptions,
                },
              },
              {
                type: "string",
                name: "customName",
                label: "Custom Name (if no linked product)",
                description: "Shown with a placeholder image when no linked product is selected.",
              },
              {
                type: "string",
                name: "type",
                label: "Type",
                description: "Optional. Pulled from Catalog Settings → Door Style Options.",
                options: catalogSettingsOptions.doorStyles,
              },
            ],
          },
          {
            type: "object",
            name: "countertopProducts",
            label: "Countertop Slabs",
            list: true,
            description: "Select countertop slab products used in this project. If no product is selected, fill in a custom name to display it without a link.",
            ui: {
              itemProps: projectCountertopProductsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "countertop",
                label: "Countertop Slab (linked product)",
                collections: ["countertop"],
                ui: {
                  optionComponent: renderCountertopReferenceOption,
                  experimental___filter: filterCountertopReferenceOptions,
                },
              },
              {
                type: "string",
                name: "customName",
                label: "Custom Name (if no linked product)",
                description: "Shown with a placeholder image when no linked product is selected.",
              },
              {
                type: "string",
                name: "type",
                label: "Type",
                description: "Optional. Pulled from Catalog Settings → Countertop Types.",
                options: catalogSettingsOptions.countertopTypes,
              },
            ],
          },
          {
            type: "object",
            name: "flooringProducts",
            label: "Flooring",
            list: true,
            description: "Select flooring products used in this project. If no product is selected, fill in a custom name to display it without a link.",
            ui: {
              itemProps: projectFlooringProductsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "flooring",
                label: "Flooring (linked product)",
                collections: ["flooring"],
                ui: {
                  optionComponent: renderFlooringReferenceOption,
                  experimental___filter: filterFlooringReferenceOptions,
                },
              },
              {
                type: "string",
                name: "customName",
                label: "Custom Name (if no linked product)",
                description: "Shown with a placeholder image when no linked product is selected.",
              },
              {
                type: "string",
                name: "type",
                label: "Type",
                description: "Optional. Pulled from Catalog Settings → Flooring Types.",
                options: catalogSettingsOptions.flooringTypes,
              },
            ],
          },
          {
            type: "object",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Search and select other project entries related to this project.",
            ui: {
              itemProps: projectRelatedProjectsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "project",
                label: "Project",
                collections: ["project"],
                ui: {
                  optionComponent: renderProjectReferenceOption,
                  experimental___filter: filterProjectReferenceOptions,
                },
              },
            ],
          },
          { type: "string", name: "slug", label: "Slug", required: true },
          { type: "string", name: "address", label: "Address" },
          { type: "string", name: "notes", label: "Notes", ui: { component: "textarea" } },
          { type: "number", name: "sourceId", label: "Source ID (Strapi)" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
        ],
      },

      // ─── COLLECTIONS: /collections/[slug] ───────────────────────
      // NOTE: Tina reserves `Query.collection` for its built-in metadata API,
      // so the content collection name must be `specialityCollection` even though
      // the URL, file path, and admin label remain "Collection(s)".
      {
        name: "specialityCollection",
        label: "Collections",
        path: "content/collections",
        format: "md",
        ui: {
          router: ({ document }) => `/collections/${document._sys.filename}`,
        },
        fields: [
          {
            type: "boolean",
            name: "published",
            label: "Published",
            description: "Only published collections appear in the Speciality strip on /gallery and on related-collections lists.",
          },
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          {
            type: "image",
            name: "coverImage",
            label: "Cover Image (used as the Speciality card thumbnail on /gallery)",
            ui: { component: renderLargeMediaPreviewField },
          },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: mediaGroupItemProps,
            },
            fields: [
              { type: "image", name: "file", label: "File", ui: { component: renderLargeMediaPreviewField } },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
            ],
          },
          {
            type: "object",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Search and select project entries to feature on this collection's detail page.",
            ui: {
              itemProps: collectionRelatedProjectsItemProps,
            },
            fields: [
              {
                type: "reference",
                name: "project",
                label: "Project",
                collections: ["project"],
                ui: {
                  optionComponent: renderProjectReferenceOption,
                  experimental___filter: filterProjectReferenceOptions,
                },
              },
            ],
          },
          { type: "string", name: "slug", label: "Slug", required: true },
          { type: "datetime", name: "sourceUpdatedAt", label: "Date" },
        ],
      },

      // ─── POSTS: /post/[slug] ────────────────────────────────────
      {
        name: "post",
        label: "Posts",
        path: "content/posts",
        ui: {
          router: ({ document }) => `/post/${document._sys.filename}`,
        },
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          seoFields(),
          { type: "datetime", name: "date", label: "Published Date" },
          {
            type: "image",
            name: "thumbnail",
            label: "Hero Image",
            description: "Displayed as the large hero image and used for related-article cards.",
          },
          {
            type: "string",
            name: "subtitle",
            label: "Hero Subtitle",
            ui: { component: "textarea" },
          },
          {
            type: "object",
            name: "relatedArticles",
            label: "Related Articles",
            list: true,
            description: "Select other articles to feature at the bottom of this page.",
            ui: {
              itemProps: (item: TinaListItem) => ({
                label: resolvePostReferenceLabel(getListItemValue(item, "post")),
              }),
            },
            fields: [
              {
                type: "string",
                name: "post",
                label: "Article",
                options: postReferenceSelectOptions,
                ui: { component: "select" },
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            templates: [
              {
                name: "ArticleImage",
                label: "Article Image",
                fields: [
                  { type: "image", name: "image", label: "Image" },
                  { type: "string", name: "alt", label: "Alt Text" },
                  { type: "string", name: "caption", label: "Caption" },
                  {
                    type: "string",
                    name: "aspectRatio",
                    label: "Aspect Ratio",
                    options: [
                      { label: "16:9", value: "landscape" },
                      { label: "1:1", value: "square" },
                      { label: "3:4", value: "portrait" },
                    ],
                    ui: { component: "select" },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
