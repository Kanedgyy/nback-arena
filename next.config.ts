import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude tests directory from compilation
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
