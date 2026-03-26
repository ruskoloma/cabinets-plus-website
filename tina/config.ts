import fs from "node:fs";
import path from "node:path";
import React from "react";
import { defineConfig } from "tinacms";
import { cabinetReferenceLabelsByValue, cabinetReferenceSelectOptions } from "./cabinet-reference-options";
import { seoFields } from "./seo-fields";

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
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "content", "global", "catalog-settings.json"), "utf8");
    const parsed = JSON.parse(raw) as {
      stainTypes?: unknown;
      doorStyles?: unknown;
      rooms?: unknown;
      paintOptions?: unknown;
      countertopTypes?: unknown;
    };
    const stainTypes = extractCatalogOptionValues(parsed.stainTypes);
    const doorStyles = extractCatalogOptionValues(parsed.doorStyles);
    const rooms = Array.isArray(parsed.rooms)
      ? parsed.rooms.map((value) => String(value).trim()).filter(Boolean)
      : [];
    const paintOptions = extractCatalogOptionValues(parsed.paintOptions);
    const countertopTypes = extractCatalogOptionValues(parsed.countertopTypes);
    return {
      stainTypes: stainTypes.length ? stainTypes : defaultCabinetStainTypes,
      doorStyles: doorStyles.length ? doorStyles : defaultDoorStyles,
      rooms: rooms.length ? rooms : defaultRooms,
      paintOptions: paintOptions.length ? paintOptions : defaultPaintOptions,
      countertopTypes: countertopTypes.length ? countertopTypes : defaultCountertopTypes,
    };
  } catch {
    return {
      stainTypes: defaultCabinetStainTypes,
      doorStyles: defaultDoorStyles,
      rooms: defaultRooms,
      paintOptions: defaultPaintOptions,
      countertopTypes: defaultCountertopTypes,
    };
  }
}

const catalogSettingsOptions = readCatalogSettingsOptions();

function resolveCabinetReferenceLabel(value: unknown) {
  const ref = String(value || "").trim();
  if (!ref) return "Select cabinet door";

  const cleaned = ref.replace(/^\/+/, "");
  const file = cleaned.split("/").pop() || cleaned;
  const slug = file.replace(/\.md$/, "");
  const normalizedWithExt = file.endsWith(".md") ? file : `${file}.md`;

  return (
    cabinetReferenceLabelsByValue[cleaned] ||
    cabinetReferenceLabelsByValue[`content/${cleaned}`] ||
    cabinetReferenceLabelsByValue[`content/cabinets/${normalizedWithExt}`] ||
    cabinetReferenceLabelsByValue[normalizedWithExt] ||
    cabinetReferenceLabelsByValue[`content/cabinets/${slug}.md`] ||
    slug
  );
}

function resolveDocumentRouteSegment(document: { _sys: { filename: string } } & Record<string, unknown>) {
  const slug = typeof document.slug === "string" ? document.slug.trim() : "";
  return slug || document._sys.filename;
}

function mediaItemLabel(item?: string | { file?: string; mimeType?: string; kind?: string }) {
  const file = typeof item === "string" ? item : item?.file;
  if (!file) return "Media item";

  const mimeType = typeof item === "string" ? "" : String(item?.mimeType || item?.kind || "");
  const name = file.split("?")[0].split("/").pop() || file;
  const cleaned = file.split("?")[0].toLowerCase();
  const isVideo =
    mimeType.toLowerCase().startsWith("video/") ||
    [".mp4", ".mov", ".webm", ".m4v", ".avi"].some((ext) => cleaned.endsWith(ext));

  if (isVideo) {
    return React.createElement(
      "span",
      { className: "inline-flex items-center gap-2" },
      React.createElement(
        "span",
        {
          className:
            "inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-gray-50 text-[10px] font-semibold uppercase text-gray-500",
        },
        "video"
      ),
      React.createElement("span", { className: "truncate" }, name)
    );
  }

  return React.createElement(
    "span",
    { className: "inline-flex items-center gap-2" },
    React.createElement("img", {
      src: file,
      alt: name,
      className: "h-8 w-8 rounded object-cover border border-gray-200",
      loading: "lazy",
    }),
    React.createElement("span", { className: "truncate" }, name)
  );
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
            ui: { itemProps: (item: any) => ({ label: item.label }) },
            fields: [
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "href", label: "Link (leave empty for dropdown)" },
              {
                type: "object", name: "children", label: "Dropdown Items", list: true,
                ui: { itemProps: (item: any) => ({ label: item.label }) },
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "href", label: "Link" },
                  {
                    type: "object",
                    name: "catalogItems",
                    label: "Catalog Items",
                    list: true,
                    description: "Shown in the right column of the Products dropdown. Cabinets and Countertops are seeded, Flooring can stay empty for now.",
                    ui: {
                      itemProps: (item: any) => ({
                        label: item?.name || item?.code || "Catalog item",
                      }),
                    },
                    fields: [
                      { type: "string", name: "name", label: "Name" },
                      { type: "string", name: "code", label: "Code" },
                      { type: "image", name: "image", label: "Image" },
                      {
                        type: "object",
                        name: "imageFrame",
                        label: "Image Frame",
                        description: "Optional render size override for wide swatches like countertops.",
                        fields: [
                          { type: "number", name: "width", label: "Width" },
                          { type: "number", name: "height", label: "Height" },
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
            ui: { itemProps: (item: any) => ({ label: item.label }) },
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
            ui: { itemProps: (item: any) => ({ label: item?.label || item?.value || "Stain type" }) },
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
            ui: { itemProps: (item: any) => ({ label: item?.label || item?.value || "Door style" }) },
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
            ui: { itemProps: (item: any) => ({ label: item?.label || item?.value || "Paint option" }) },
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
            ui: { itemProps: (item: any) => ({ label: item?.label || item?.value || "Countertop type" }) },
            fields: [
              { type: "string", name: "value", label: "Value", required: true },
              { type: "string", name: "label", label: "Label" },
              { type: "image", name: "image", label: "Image" },
            ],
          },
        ],
      },
      {
        name: "cabinetPageSettings",
        label: "Cabinet Page Settings",
        path: "content/global",
        format: "json",
        match: {
          include: "cabinet-page-settings",
        },
        ui: {
          global: true,
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { type: "string", name: "breadcrumbLabel", label: "Breadcrumb Label" },
          { type: "string", name: "technicalDetailsTitle", label: "Technical Details Title" },
          { type: "string", name: "contactButtonLabel", label: "Contact Button Label" },
          { type: "string", name: "descriptionLabel", label: "Description Label" },
          { type: "string", name: "relatedProductsTitle", label: "Related Products Title" },
          { type: "string", name: "projectsSectionTitle", label: "Projects Section Title" },
          {
            type: "string",
            name: "projectsSectionDescription",
            label: "Projects Section Description",
            ui: { component: "textarea" },
          },
          { type: "string", name: "projectFallbackTitle", label: "Project Card Fallback Title" },
          {
            type: "object",
            name: "mockProjects",
            label: "Mock Projects (fallback)",
            list: true,
            fields: [
              { type: "image", name: "file", label: "Image" },
              { type: "string", name: "title", label: "Title" },
            ],
          },
        ],
      },

      // ─── PAGES: home, about-us, contact-us (blocks-based) ─────
      {
        name: "page",
        label: "Pages",
        path: "content/pages",
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
                name: "productsSection", label: "Products Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object", name: "products", label: "Products", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.name }) },
                    fields: [
                      { type: "string", name: "name", label: "Name" },
                      { type: "image", name: "image", label: "Image" },
                      { type: "string", name: "link", label: "Link" },
                    ],
                  },
                ],
              },
              {
                name: "servicesSection", label: "Services Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object", name: "services", label: "Services", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.title }) },
                    fields: [
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                      { type: "image", name: "image", label: "Image" },
                      { type: "string", name: "link", label: "Link" },
                    ],
                  },
                ],
              },
              {
                name: "projectsSection", label: "Projects Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "ctaLabel", label: "CTA Text" },
                  { type: "string", name: "ctaLink", label: "CTA Link" },
                  { type: "image", name: "images", label: "Project Images", list: true },
                ],
              },
              {
                name: "whyUsSection", label: "Why Us Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "subtitle", label: "Subtitle" },
                  { type: "string", name: "introText", label: "Intro Text (line 1)", ui: { component: "textarea" } },
                  { type: "string", name: "introText2", label: "Intro Text (line 2)", ui: { component: "textarea" } },
                  {
                    type: "object", name: "features", label: "Features", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.title }) },
                    fields: [
                      { type: "string", name: "icon", label: "Icon (emoji)" },
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                      { type: "image", name: "image", label: "Feature Image" },
                    ],
                  },
                ],
              },
              {
                name: "aboutSection", label: "About Section",
                fields: [
                  { type: "string", name: "trustStripText", label: "Top Trust Message", ui: { component: "textarea" } },
                  { type: "string", name: "trustStripHighlight", label: "Top Trust Message Highlight" },
                  { type: "image", name: "trustStripTexture", label: "Top Trust Background Texture" },
                  {
                    type: "object", name: "stats", label: "Stats", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.label }) },
                    fields: [
                      { type: "string", name: "value", label: "Value" },
                      { type: "string", name: "label", label: "Label" },
                    ],
                  },
                  { type: "image", name: "membershipDesktopLogo", label: "Membership Logo (Desktop)" },
                  { type: "image", name: "membershipMobileTopLogo", label: "Membership Logo Top (Mobile)" },
                  { type: "image", name: "membershipMobileBottomLogo", label: "Membership Logo Bottom (Mobile)" },
                  { type: "string", name: "membershipLabel", label: "Membership Label" },
                  { type: "string", name: "partnershipLabel", label: "Partnership Label" },
                  {
                    type: "object", name: "partnerLogos", label: "Partner Logos", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.alt || "Partner logo" }) },
                    fields: [
                      { type: "image", name: "logo", label: "Logo" },
                      { type: "string", name: "alt", label: "Alt Text" },
                    ],
                  },
                  { type: "string", name: "ctaLabel", label: "Button Text" },
                  { type: "string", name: "ctaLink", label: "Button Link" },
                ],
              },
              {
                name: "showroomBanner", label: "Showroom Banner",
                fields: [
                  { type: "string", name: "heading", label: "Heading" },
                  { type: "string", name: "subtext", label: "Subtext", ui: { component: "textarea" } },
                  { type: "string", name: "ctaLabel", label: "CTA Text" },
                  { type: "string", name: "ctaLink", label: "CTA Link" },
                  { type: "image", name: "image", label: "Main Image" },
                ],
              },
              {
                name: "processSection", label: "Process Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object", name: "steps", label: "Steps", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.title }) },
                    fields: [
                      { type: "number", name: "number", label: "Step Number" },
                      { type: "image", name: "iconImage", label: "Step Icon" },
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                      { type: "string", name: "icon", label: "Legacy Icon (optional)" },
                    ],
                  },
                ],
              },
              {
                name: "faqSection", label: "FAQ Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object", name: "tabs", label: "FAQ Tabs", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.label }) },
                    fields: [
                      { type: "string", name: "label", label: "Tab Label" },
                      {
                        type: "object", name: "faqs", label: "FAQs", list: true,
                        ui: { itemProps: (item: any) => ({ label: item.question }) },
                        fields: [
                          { type: "string", name: "question", label: "Question" },
                          { type: "string", name: "answer", label: "Answer", ui: { component: "textarea" } },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: "contactSection", label: "Contact Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "image", name: "image", label: "Section Image" },
                  { type: "string", name: "nameLabel", label: "Name Field Label" },
                  { type: "string", name: "namePlaceholder", label: "Name Placeholder" },
                  { type: "string", name: "emailLabel", label: "Email Field Label" },
                  { type: "string", name: "emailPlaceholder", label: "Email Placeholder" },
                  { type: "string", name: "messageLabel", label: "Message Field Label" },
                  { type: "string", name: "messagePlaceholder", label: "Message Placeholder" },
                  { type: "string", name: "submitLabel", label: "Submit Button Label" },
                  { type: "string", name: "showroomTitle", label: "Showroom Title" },
                  { type: "string", name: "followUsLabel", label: "Follow Label" },
                  { type: "string", name: "mapEmbedUrl", label: "Google Maps Embed URL", ui: { component: "textarea" } },
                ],
              },
              {
                name: "richContent", label: "Rich Text Content",
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "rich-text", name: "body", label: "Content" },
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
                    ui: { itemProps: (item: any) => ({ label: item.title }) },
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
          { type: "string", name: "name", label: "Name", isTitle: true, required: true },
          { type: "string", name: "code", label: "Code", required: true },
          { type: "string", name: "slug", label: "Slug", required: true },
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
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          { type: "image", name: "picture", label: "Primary Picture" },
          {
            type: "string",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Project slugs or IDs related to this cabinet door.",
          },
          {
            type: "object",
            name: "relatedProducts",
            label: "Related Products",
            list: true,
            description: "Select other cabinet door entries from this collection.",
            ui: {
              itemProps: (item: any) => ({
                label: resolveCabinetReferenceLabel(item?.product),
              }),
            },
            fields: [
              {
                type: "string",
                name: "product",
                label: "Cabinet Door",
                options: cabinetReferenceSelectOptions,
                ui: { component: "select" },
              },
            ],
          },
          {
            type: "object",
            name: "technicalDetails",
            label: "Technical Details",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item.key || "Detail" }) },
            fields: [
              { type: "string", name: "key", label: "Key" },
              { type: "string", name: "value", label: "Value" },
              { type: "string", name: "unit", label: "Unit" },
              { type: "number", name: "order", label: "Order" },
            ],
          },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: (item: any) => ({
                label: mediaItemLabel(item) as any,
              }),
            },
            fields: [
              { type: "image", name: "file", label: "File" },
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
          { type: "number", name: "sourceId", label: "Source ID (Strapi)" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
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
          { type: "string", name: "name", label: "Name", isTitle: true, required: true },
          { type: "string", name: "code", label: "Code", required: true },
          { type: "string", name: "slug", label: "Slug", required: true },
          {
            type: "string",
            name: "countertopType",
            label: "Countertop Type",
            options: catalogSettingsOptions.countertopTypes,
          },
          { type: "boolean", name: "inStock", label: "In Stock" },
          { type: "string", name: "storeCollection", label: "Store Collection" },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          { type: "image", name: "picture", label: "Primary Picture" },
          {
            type: "object",
            name: "technicalDetails",
            label: "Technical Details",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item.key || "Detail" }) },
            fields: [
              { type: "string", name: "key", label: "Key" },
              { type: "string", name: "value", label: "Value" },
              { type: "string", name: "unit", label: "Unit" },
              { type: "number", name: "order", label: "Order" },
            ],
          },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: (item: any) => ({
                label: mediaItemLabel(item) as any,
              }),
            },
            fields: [
              { type: "image", name: "file", label: "File" },
              { type: "string", name: "kind", label: "Kind", options: ["image", "video", "other"] },
              { type: "string", name: "mimeType", label: "MIME Type" },
              { type: "boolean", name: "isPrimary", label: "Primary" },
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "altText", label: "Alt Text" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
              { type: "number", name: "sourceId", label: "Source Media ID (Strapi)" },
            ],
          },
          { type: "number", name: "sourceId", label: "Source ID (Strapi)" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
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
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "string", name: "slug", label: "Slug", required: true },
          { type: "string", name: "address", label: "Address" },
          { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
          { type: "string", name: "notes", label: "Notes", ui: { component: "textarea" } },
          { type: "image", name: "primaryPicture", label: "Primary Picture" },
          {
            type: "string",
            name: "relatedProjects",
            label: "Related Projects",
            list: true,
            description: "Related project slugs.",
          },
          {
            type: "object",
            name: "media",
            label: "Media",
            list: true,
            ui: {
              itemProps: (item: any) => ({
                label: mediaItemLabel(item) as any,
              }),
            },
            fields: [
              { type: "image", name: "file", label: "File" },
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
          { type: "number", name: "sourceId", label: "Source ID (Strapi)" },
          { type: "datetime", name: "sourceUpdatedAt", label: "Source Updated At" },
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
          { type: "image", name: "thumbnail", label: "Thumbnail" },
          { type: "string", name: "excerpt", label: "Excerpt", ui: { component: "textarea" } },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
    ],
  },
});
