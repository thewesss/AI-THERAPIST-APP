import type { NextConfig } from "next";

import { join } from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    tsconfigPaths: true, // makes Next.js respect tsconfig paths in production
  }
};

export default nextConfig;
