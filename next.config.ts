// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Only show warnings, don’t fail production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;



