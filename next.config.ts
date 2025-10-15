/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Only show warnings, don’t fail production builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;


