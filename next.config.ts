import type { NextConfig } from "next";

// Retired blog posts from the old site with no 1:1 replacement — 308-redirect
// each to the closest live hub so accumulated link equity is preserved instead
// of 404ing. Old /blog/post/<slug> URLs reach these via the first redirect rule.
// (Restore a high-value guide later by adding content/posts/<slug>.md and
// removing its entry here.)
const RETIRED_POST_REDIRECTS: Record<string, string> = {
  // Renamed survivors / exact targets
  "cabinets-design-trends-2023": "/post/cabinet-design-trends-2026",
  "countertops-design-trends-2023": "/post/countertop-design-trends-2026",
  "privacy-policy": "/privacy-policy",
  // → /flooring
  "4-types-of-flooring": "/flooring",
  "cheap-flooring-options": "/flooring",
  "flooring-101": "/flooring",
  "flooring-design-trends-2023": "/flooring",
  "flooring-home-gym-options": "/flooring",
  "flooring-showroom-spokane-kootenai": "/flooring",
  "flooring-store-vs-big-box-retailers": "/flooring",
  "maintenance-tips-for-long-lasting-flooring": "/flooring",
  "new-flooring-benefits": "/flooring",
  "quality-flooring-options-near-you": "/flooring",
  "radiant-heat-under-laminate-lvp-spokane": "/flooring",
  "soundproof-flooring-hacks-multi-level-homes": "/flooring",
  "spokane-pet-friendly-scratch-proof-flooring": "/flooring",
  "spokane-waterproof-flooring": "/flooring",
  "the-benefits-of-local-flooring-store": "/flooring",
  "ultimate-guide-kitchen-flooring-options-considerations": "/flooring",
  // → /cabinets
  "budget-friendly-upgrades-for-cabinets-and-countertops": "/cabinets",
  "cabinet-refacing-vs-replacement-which-is-better": "/cabinets",
  "custom-cabinets-they-are-worth": "/cabinets",
  "custom-cabinets-vs-stock-cabinets": "/cabinets",
  "eco-friendly-cabinet-materials-guide": "/cabinets",
  "eco-friendly-cabinets": "/cabinets",
  "how-custom-cabinets-are-built": "/cabinets",
  "introduction-to-cabinet-hardware": "/cabinets",
  "maximizing-with-smart-cabinet-design": "/cabinets",
  "plywood-vs-particle-board-cabinets": "/cabinets",
  "pros-cons-different-cabinet-materials": "/cabinets",
  "selecting-perfect-kitchen-cabinets": "/cabinets",
  "small-kitchen-cabinet-ideas-spokane": "/cabinets",
  "why-custom-cabinets-expensive": "/cabinets",
  // → /countertops
  "countertops-process": "/countertops",
  "guide-marble-granite-quartzite-quartz-countertops": "/countertops",
  "quartz-countertop-manufacturing-process": "/countertops",
  "quartz-countertops-for-your-kitchen": "/countertops",
  "quartz-countertops-pros-and-cons": "/countertops",
  // → /kitchen-remodel
  "kitchen-design-color-psychology": "/kitchen-remodel",
  "kitchen-remodel-mistakes-to-avoid": "/kitchen-remodel",
  "kitchen-work-triangle-efficient-design": "/kitchen-remodel",
  "maximizing-optimizing-kitchen-space-tips": "/kitchen-remodel",
  "perfect-kitchen-anatomy": "/kitchen-remodel",
  "pros-and-cons-of-open-shelving-in-kitchens": "/kitchen-remodel",
  "the-6-kitchen-combos-for-spokanians": "/kitchen-remodel",
  "tips-for-budget-friendly-kitchen-makeover": "/kitchen-remodel",
  "top-kitchen-trends-2023": "/kitchen-remodel",
  "what-expect-in-kitchen-design-trends-2024": "/kitchen-remodel",
  "your-technology-kitchen": "/kitchen-remodel",
  // → /bathroom-remodel
  "designing-bathroom-step-by-step": "/bathroom-remodel",
  "mastering-small-bathroom-design": "/bathroom-remodel",
  "modern-vs-traditional-bathroom-designs": "/bathroom-remodel",
  // → /magazine (low-value DIY + Instagram recap posts)
  "diy-home-renovations": "/magazine",
  "insta-insights-1-12-24": "/magazine",
  "insta-insights-1-5-24": "/magazine",
  "insta-insights-10-12-23": "/magazine",
  "insta-insights-10-20-23": "/magazine",
  "insta-insights-10-6-23": "/magazine",
  "insta-insights-11-17-23": "/magazine",
  "insta-insights-11-24-23": "/magazine",
  "insta-insights-12-15-23": "/magazine",
  "insta-insights-12-22-23": "/magazine",
  "insta-insights-12-8-23": "/magazine",
  "insta-insights-7-12-23": "/magazine",
  "insta-insights-7-24-23": "/magazine",
  "insta-insights-8-11-23": "/magazine",
  "insta-insights-8-18-23": "/magazine",
  "insta-insights-8-25-23": "/magazine",
  "insta-insights-8-4-23": "/magazine",
  "insta-insights-9-1-23": "/magazine",
  "insta-insights-9-15-23": "/magazine",
  "insta-insights-9-22-23": "/magazine",
  "insta-insights-9-29-23": "/magazine",
  "insta-insights-9-8-23": "/magazine",
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cabinetsplus4630.s3.us-west-2.amazonaws.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async redirects() {
    return [
      // Legacy blog-post URLs from the old site → new /post/<slug>.
      {
        source: "/blog/post/:slug",
        destination: "/post/:slug",
        permanent: true,
      },
      // Old contact page slug.
      {
        source: "/contacts",
        destination: "/contact-us",
        permanent: true,
      },
      // Old numeric blog pagination (/blog/1 … /blog/5) — single blog index now.
      {
        source: "/blog/:page(\\d+)",
        destination: "/blog",
        permanent: true,
      },
      // Old numeric cabinet category pages (/cabinets/1 …) — slug-based now.
      // Real detail slugs (e.g. /cabinets/aab) and /cabinets/catalog don't match \d+.
      {
        source: "/cabinets/:id(\\d+)",
        destination: "/cabinets",
        permanent: true,
      },
      // Old numeric flooring pages (/flooring/1 …) — catalog-based now.
      {
        source: "/flooring/:id(\\d+)",
        destination: "/flooring",
        permanent: true,
      },
      // Old countertop entry pages.
      {
        source: "/countertops/selection",
        destination: "/countertops/catalog",
        permanent: true,
      },
      {
        source: "/countertops/slabs-in-stock",
        destination: "/countertops/catalog",
        permanent: true,
      },
      // Old faceted/paginated countertop views (/countertops/<facet>/<n>).
      // Detail pages are single-segment (/countertops/<slug>), so they're unaffected.
      {
        source: "/countertops/:facet/:page(\\d+)",
        destination: "/countertops/catalog",
        permanent: true,
      },
      // Old gallery project URLs — projects were renamed (no clean 1:1), send to the gallery index.
      {
        source: "/gallery/project/:slug*",
        destination: "/gallery",
        permanent: true,
      },
      // Retired blog posts → closest live hub (308). See RETIRED_POST_REDIRECTS above.
      ...Object.entries(RETIRED_POST_REDIRECTS).map(([slug, destination]) => ({
        source: `/post/${slug}`,
        destination,
        permanent: true,
      })),
      // Belt-and-suspenders canonical-host enforcement (apex → www). Vercel's
      // domain redirect normally handles this at the edge; this guarantees a
      // permanent (308) apex→www at the app layer if that platform redirect changes.
      {
        source: "/:path*",
        has: [{ type: "host", value: "spokanecabinetsplus.com" }],
        destination: "https://www.spokanecabinetsplus.com/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/figma/assets/logo-main.svg",
          destination: "/library/branding/logo-main.svg",
        },
        {
          source: "/figma/assets/logo-footer-light.svg",
          destination: "/library/branding/logo-footer-light.svg",
        },
        {
          source: "/figma/assets/:path*",
          destination: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/:path*",
        },
        {
          source: "/figma/home/:path*",
          destination: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
