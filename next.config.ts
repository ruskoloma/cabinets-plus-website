import type { NextConfig } from "next";

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
      // Legacy URL from the old site — keep these reachable.
      {
        source: "/blog/post/:slug",
        destination: "/post/:slug",
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
