import { defineConfig } from "tinacms";
import { seoFields } from "./seo-fields";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "", publicFolder: "public" } },
  schema: {
    collections: [
      // ─── GLOBAL: Navbar + Footer ───────────────────────────────
      {
        name: "global",
        label: "Global Settings",
        path: "content/global",
        format: "json",
        ui: {
          global: true,
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { type: "string", name: "siteName", label: "Site Name" },
          { type: "string", name: "phone", label: "Phone" },
          { type: "string", name: "address", label: "Address" },
          { type: "string", name: "email", label: "Email" },
          { type: "string", name: "hours", label: "Business Hours" },
          { type: "string", name: "ctaLabel", label: "CTA Button Text" },
          { type: "string", name: "ctaLink", label: "CTA Button Link" },
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
          { type: "string", name: "instagramUrl", label: "Instagram URL" },
          { type: "string", name: "facebookUrl", label: "Facebook URL" },
          { type: "string", name: "copyrightText", label: "Copyright Text" },
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
                  {
                    type: "object", name: "features", label: "Features", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.title }) },
                    fields: [
                      { type: "string", name: "icon", label: "Icon (emoji)" },
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                    ],
                  },
                ],
              },
              {
                name: "aboutSection", label: "About Section",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "bodyText", label: "Body Text", ui: { component: "textarea" } },
                  {
                    type: "object", name: "stats", label: "Stats", list: true,
                    ui: { itemProps: (item: any) => ({ label: item.label }) },
                    fields: [
                      { type: "string", name: "value", label: "Value" },
                      { type: "string", name: "label", label: "Label" },
                    ],
                  },
                ],
              },
              {
                name: "showroomBanner", label: "Showroom Banner",
                fields: [
                  { type: "string", name: "heading", label: "Heading" },
                  { type: "string", name: "subtext", label: "Subtext", ui: { component: "textarea" } },
                  { type: "string", name: "ctaLabel", label: "CTA Text" },
                  { type: "string", name: "ctaLink", label: "CTA Link" },
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
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
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
                  // ℹ️ Contact info comes from Global Settings
                  // ℹ️ Form labels/placeholders are set in the component
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
