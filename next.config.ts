import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // Reduce memory usage during build (helps with Render free plan 512MB RAM)
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Copy static + public files into standalone automatically during build
  // (no need for manual cp commands in package.json)
  outputFileTracingRoot: undefined,
};

export default nextConfig;
