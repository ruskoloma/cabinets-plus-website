/**
 * Shared SEO object template for all TinaCMS collections.
 * Add { ...seoFields() } to any collection's fields array.
 */
export const seoFields = () => ({
  type: "object" as const,
  name: "seo",
  label: "SEO",
  fields: [
    {
      type: "string" as const,
      name: "title",
      label: "Page Title",
      description: "Overrides the page title in browser tab and search results. Leave blank to use the page's main title.",
    },
    {
      type: "string" as const,
      name: "description",
      label: "Meta Description",
      description: "Short summary shown in search results (recommended: 150–160 characters).",
      ui: { component: "textarea" },
    },
    {
      type: "image" as const,
      name: "ogImage",
      label: "Social Share Image (OG Image)",
      description: "Image shown when sharing on social media. Recommended: 1200×630px.",
    },
  ],
});
