import type { NextConfig } from "next";

// The site is a static export served by GitHub Pages, under the repo's
// path (e.g. /portfolio), which the deploy workflow passes in. Empty for
// local dev.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // No image server on GitHub Pages: images are served as they are.
  images: { unoptimized: true },
  // For plain media tags, which don't get basePath added automatically.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
